# vscode-circuitpython README

This extension aspires to bring your entire CircuitPython workflow into a single
place in VSCode.

Inspired by [Scott Hanselman's blog
post](https://www.hanselman.com/blog/UsingVisualStudioCodeToProgramCircuitPythonWithAnAdaFruitNeoTrellisM4.aspx)
and the [VSCode Arduino extension](https://github.com/Microsoft/vscode-arduino).

## Features

### Serial Console

`Circuit Python: Open Serial Console` will prompt you for a serial port to
connect to, then it will display the serial output form the board attached to
that port. The port can be changed by clicking on it's path in the status bar.

It will also change your workspace's default `board.pyi` file for autocomplete
to the one that matches the USB Vendor ID & Product ID.

If you want to manually choose a different board, a list is availble with the
command `CircuitPython: Choose CircuitPython Board`, and also by clicking on the
board name in the status bar.

### Auto Complete Adafruit Libraries

This extension will install [Circup](https://github.com/adafruit/circup) via
`pip` if you don't already have it installed, and use the python source files in
`adafruit_circuitpython_bundle_py` to auto complete all adafruit bundled
libraries.

### Circup

`CircuitPython: Show Available Libraries` will give you a dropdown of all
libraries in the Adafruit bundle. If it's installed on the board you've got
plugged in, you'll see a version number in the dropdown as well. Clicking
installed libraries does nothing, but if it's not installed, clicking will add
it.

`CircuitPython: Update All Libraries` will run `circup update --all`.

### Demo

![Demo](images/circuitpy-demo.gif)

## TODO

* Only tested so far on macOS 10.15


## Future Work

* Refactor as I learn more about VSCode Extensions & Typescript

## Requirements

## Extension Settings

None so far.

## Known Issues

* Only tested so far on macOS. YMMV on other platforms for now, but I have access
  to enough that the work will continue if there's demand there.
 
  modules.
## Release Notes

### 0.0.1

Initial release.
* Serial Monitor
* Autocomplete
* Circup
