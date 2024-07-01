#!/usr/bin/env python3
# This is a script for using circuitpython's repo to make pyi files for each board type.
# These need to be bundled with the extension, which means that adding new boards is still
# a new release of the extension.

import json
import pathlib
import re


def main():
    repo_root = pathlib.Path(__file__).resolve().parent.parent
    # First thing we want to do is store in memory, the contents of
    # ./stubs/board/__init__.py so we can append it (partially) to
    # every other board.
    # See [Issue #26](https://github.com/joedevivo/vscode-circuitpython/issues/26)
    # for more on this.
    board_stub = repo_root / "stubs" / "board" / "__init__.pyi"
    generic_stubs = parse_generic_stub(board_stub)

    circuitpy_repo_root = repo_root / "circuitpython"
    boards = process_boards(repo_root, circuitpy_repo_root, generic_stubs)

    json_file = repo_root / "boards" / "metadata.json"
    with open(json_file, "w") as metadata:
        json.dump(boards, metadata)


def parse_generic_stub(board_stub):
    generic_stubs = {}
    def_re = re.compile(r"def ([^\(]*)\(.*")
    with open(board_stub) as stub:
        stubs = stub.readlines()

        # Find the first line number and name of each definition
        f = []
        names = []
        for i, s in enumerate(stubs):
            match = def_re.match(s)
            if match is not None:
                f.append(i)
                names.append(match[1])
        f.append(len(stubs))

        # Iterate the line ranges
        for name, start, end in zip(names, f, f[1:]):
            generic_stubs[name] = "".join(stubs[start:end])
    return generic_stubs


def normalize_vid_pid(vid_or_pid: str):
    """Make a hex string all uppercase except for the 0x."""
    return vid_or_pid.upper().replace("0X", "0x")


_PIN_DEF_RE = re.compile(
    r"\s*{\s*(?:MP_ROM_QSTR|MP_OBJ_NEW_QSTR)\(MP_QSTR_(?P<name>[^\)]*)\)\s*,\s*MP_ROM_PTR\((?P<value>[^\)]*)\).*"
)


def parse_pins(generic_stubs, pins: pathlib.Path, board_stubs):
    imports = set()
    stub_lines = []
    with open(pins) as p:
        for line in p:
            pin = _PIN_DEF_RE.match(line)
            if pin is None:
                continue
            pin_name = pin.group("name")
            if pin_name in generic_stubs:
                board_stubs[pin_name] = generic_stubs[pin_name]
                if "busio" in generic_stubs[pin_name]:
                    imports.add("busio")
                continue

            pin_type = None

            # sometimes we can guess better based on the value
            pin_value = pin.group("value")
            if pin_value == "&displays[0].epaper_display":
                imports.add("displayio")
                pin_type = "displayio.EPaperDisplay"
            elif pin_value == "&displays[0].display":
                imports.add("displayio")
                pin_type = "displayio.Display"
            elif pin_value.startswith("&pin_"):
                imports.add("microcontroller")
                pin_type = "microcontroller.Pin"

            if pin_type is None:
                imports.add("typing")
                pin_type = "typing.Any"

            stub_lines.append("{0}: {1} = ...\n".format(pin_name, pin_type))

    imports_string = "".join("import %s\n" % x for x in sorted(imports))

    stubs_string = "".join(stub_lines)
    return imports_string, stubs_string


# now, while we build the actual board stubs, replace any line that starts with `  $name:` with value


def process_boards(repo_root, circuitpy_repo_root, generic_stubs):
    boards = []

    board_configs = circuitpy_repo_root.glob("ports/*/boards/*/mpconfigboard.mk")
    for config in board_configs:
        b = config.parent
        site_path = b.stem

        print(config)
        pins = b / "pins.c"
        if not config.is_file() or not pins.is_file():
            continue

        usb_vid = ""
        usb_pid = ""
        usb_product = ""
        usb_manufacturer = ""
        with open(config) as conf:
            for line in conf:
                if line.startswith("USB_VID"):
                    usb_vid = line.split("=")[1].split("#")[0].strip('" \n')
                elif line.startswith("USB_PID"):
                    usb_pid = line.split("=")[1].split("#")[0].strip('" \n')
                elif line.startswith("USB_PRODUCT"):
                    usb_product = line.split("=")[1].split("#")[0].strip('" \n')
                elif line.startswith("USB_MANUFACTURER"):
                    usb_manufacturer = line.split("=")[1].split("#")[0].strip('" \n')

                # CircuitPython 7 BLE-only boards
                elif line.startswith("CIRCUITPY_CREATOR_ID"):
                    usb_vid = line.split("=")[1].split("#")[0].strip('" \n')
                elif line.startswith("CIRCUITPY_CREATION_ID"):
                    usb_pid = line.split("=")[1].split("#")[0].strip('" \n')
        if usb_manufacturer == "Nadda-Reel Company LLC":
            continue

        usb_vid = normalize_vid_pid(usb_vid)
        usb_pid = normalize_vid_pid(usb_pid)

        # CircuitPython 7 BLE-only boards have no usb manuf/product
        description = site_path
        if usb_manufacturer and usb_product:
            description = "{0} {1}".format(usb_manufacturer, usb_product)

        board = {
            "vid": usb_vid,
            "pid": usb_pid,
            "product": usb_product,
            "manufacturer": usb_manufacturer,
            "site_path": site_path,
            "description": description,
        }
        boards.append(board)
        print(
            "{0}:{1} {2}, {3}".format(usb_vid, usb_pid, usb_manufacturer, usb_product)
        )
        board_pyi_path = repo_root / "boards" / usb_vid / usb_pid
        board_pyi_path.mkdir(parents=True, exist_ok=True)
        board_pyi_file = board_pyi_path / "board.pyi"

        # We're going to put the common stuff from the generic board stub at the
        # end of the file, so we'll collect them after the loop
        board_stubs = {}

        with open(board_pyi_file, "w") as outfile:
            imports_string, stubs_string = parse_pins(generic_stubs, pins, board_stubs)
            outfile.write("from __future__ import annotations\n")
            outfile.write(imports_string)

            # start of module doc comment
            outfile.write('"""\n')
            outfile.write("board {0}\n".format(board["description"]))
            outfile.write(
                "https://circuitpython.org/boards/{0}\n".format(board["site_path"])
            )
            outfile.write('"""\n')

            # start of actual stubs
            outfile.write(stubs_string)

            for p in board_stubs:
                outfile.write("{0}\n".format(board_stubs[p]))
    return boards


if __name__ == "__main__":
    main()
