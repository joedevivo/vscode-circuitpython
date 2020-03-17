import appdirs
import subprocess
import os
import circup
import mypy
import pathlib
import re
import glob
import json

# This is a script for using circuitpython's repo to make pyi files for each board type.
# These need to be bundled with the extension, which means that adding new boards is still
# a new release of the extension.
board_dirs = glob.glob("circuitpython/ports/*/boards/*")
boards = []
for b in board_dirs :
  config = pathlib.Path(os.path.join(b, "mpconfigboard.mk"))
  print(config)
  pins   = pathlib.Path(os.path.join(b, "pins.c"))
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
    if usb_manufacturer == "Nadda-Reel Company LLC":
      continue

    board = { 'vid': usb_vid, 'pid': usb_pid, 'product': usb_product, 'manufacturer': usb_manufacturer }
    boards.append(board)
    print("{0}:{1} {2}, {3}".format(usb_vid, usb_pid, usb_manufacturer, usb_product))
    board_pyi_path = pathlib.Path(os.path.join("boards", usb_vid, usb_pid))
    board_pyi_path.mkdir(parents=True, exist_ok=True)
    board_pyi_file = pathlib.Path(os.path.join(board_pyi_path, "board.pyi"))
    first = True

    with open(board_pyi_file, 'w') as outfile, open(pins) as p:
      outfile.write("from typing import Any\n")
      outfile.write('"""\n')
      outfile.write('board\n')
      outfile.write('"""\n')
      for line in p:
        pin = re.search(r'.*_QSTR\(MP_QSTR_([^\)]*)', line)
        if not(pin == None):
          if first:
            outfile.write("    board.{0}: Any = ...\n".format(pin[1]))
            first = False
          else:
            outfile.write("    {0}: Any = ...\n".format(pin[1]))

json_file = pathlib.Path(os.path.join("boards", "metadata.json"))
with open(json_file, 'w') as metadata:
  json.dump(boards, metadata)
