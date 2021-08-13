#!/usr/bin/env python3
# This is a script for using circuitpython's repo to make pyi files for each board type.
# These need to be bundled with the extension, which means that adding new boards is still
# a new release of the extension.

#import mypy
import json
import pathlib
import re


repo_root = pathlib.Path(__file__).resolve().parent.parent
# First thing we want to do is store in memory, the contents of
# ./stubs/board/__init__.py so we can append it to
# every other board.
board_stub = repo_root / "stubs" / "board" / "__init__.pyi"

# See [Issue #26](https://github.com/joedevivo/vscode-circuitpython/issues/26)
# for more on this.
generic_stubs = {}
with open(board_stub) as stub:
  stubs = stub.readlines()
  i = 0
  f = []
  for s in stubs:
    if s.startswith('def'):
      f.append(i)
    i += 1
  f.append(i)

  x = f.pop(0)
  for y in f:
    it = '  ' + ''.join(stubs[x:y-1])
    r = re.search(r'def ([^\(]*)\(', it)
    k = r[1]
    generic_stubs[k] = it
    x = y

def normalize_vid_pid(vid_or_pid: str):
  """Make a hex string all uppercase except for the 0x."""
  return vid_or_pid.upper().replace("0X", "0x")


def parse_pins(generic_stubs, pins, board_stubs):
  imports = set()
  stub_lines = []
  with open(pins) as p:
    for line in p:
      pin = re.search(r'.*_QSTR\(MP_QSTR_([^\)]*)', line)
      if pin is None:
        continue
      pin_name = pin[1]
      if pin_name in generic_stubs:
        board_stubs[pin_name] = generic_stubs[pin_name]
        if "busio" in generic_stubs[pin_name]:
          imports.add("import busio\n")
        continue

      pin_type = "Any"

      # sometimes we can guess better based on the value
      advanced_pin = re.search(r'.*_QSTR\(MP_QSTR_([^\)]*)\)\s*,\s*MP_ROM_PTR\(([^\)]*)\)', line)
      if advanced_pin is not None:
        pin_value = advanced_pin[2]
        if pin_value.startswith("&displays"):
          imports.add("import displayio\n")
          pin_type = "displayio.Display"
      
      stub_lines.append("{0}: {1} = ...\n".format(pin_name, pin_type))

  imports_string = "".join(sorted(imports))

  # Indent 0 char for the first pin, 2 for the rest
  stubs_string = "  ".join(stub_lines)
  return imports_string, stubs_string

# now, while we build the actual board stubs, replace any line that starts with `  $name:` with value

board_dirs = repo_root.glob("circuitpython/ports/*/boards/*")
boards = []

for b in board_dirs:
  site_path = b.stem

  config = b / "mpconfigboard.mk"
  print(config)
  pins   = b / "pins.c"
  if config.is_file() and pins.is_file():

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
      description = '{0} {1}'.format(usb_manufacturer, usb_product)

    board = {'vid': usb_vid, 'pid': usb_pid, 'product': usb_product,
             'manufacturer': usb_manufacturer, 'site_path': site_path,
             'description': description}
    boards.append(board)
    print("{0}:{1} {2}, {3}".format(usb_vid, usb_pid, usb_manufacturer, usb_product))
    board_pyi_path = repo_root / "boards" / usb_vid / usb_pid
    board_pyi_path.mkdir(parents=True, exist_ok=True)
    board_pyi_file = board_pyi_path / "board.pyi"

    # We're going to put the common stuff from the generic board stub at the
    # end of the file, so we'll collect them after the loop
    board_stubs = {}

    with open(board_pyi_file, 'w') as outfile:
      imports_string, stubs_string = parse_pins(generic_stubs, pins, board_stubs)
      outfile.write("from __future__ import annotations\n")
      outfile.write("from typing import Any\n")
      outfile.write(imports_string)

      # start of module doc comment
      outfile.write('"""\n')
      outfile.write('board {0}\n'.format(board['description']))
      outfile.write('https://circuitpython.org/boards/{0}\n'.format(board['site_path']))
      outfile.write('"""\n')

      # start of actual stubs
      outfile.write("  board.")
      outfile.write(stubs_string)

      for p in board_stubs:
        outfile.write("{0}\n".format(board_stubs[p]))

json_file = repo_root / "boards" / "metadata.json"
with open(json_file, 'w') as metadata:
  json.dump(boards, metadata)
