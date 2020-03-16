# vscode-circuitpython README

This extension aspires to bring your entire CircuitPython workflow into a single
place in VSCode.

Inspired by [Scott Hanselman's blog
post](https://www.hanselman.com/blog/UsingVisualStudioCodeToProgramCircuitPythonWithAnAdaFruitNeoTrellisM4.aspx)
and the [VSCode Arduino extension](https://github.com/Microsoft/vscode-arduino).

## Features

### Library Management

v0.0.2 introduced a [Circup](https://github.com/adafruit/circup) inspired
library manager, with an emphasis on VSCode integration. It downloads new
bundles automatically.

You can use it with the following commands:

* `CircuitPython: Show Available Libraries`
  This is every library in the Adafruit Bundle. Alphabetical, but 
  installed libraries are grouped on top. Click an out of date library 
  to update, click an uninstalled library to install it.
* `CircuitPython: List Project Libraries`
  Lists what's in your project's lib. If anything is out of date, click 
  it to update.
* `CircuitPython: Reload Project Libraries` 
  In case it's reporting incorrectly. This can happen if you modify the 
  filesystem outside of vscode.
* `CircuitPython: Update All Libraries`
  Equivalent of `circup update --all`

### Serial Console

`Circuit Python: Open Serial Console` will prompt you for a serial port to
connect to, then it will display the serial output form the board attached to
that port. The port can be changed by clicking on it's path in the status bar.

Note: There are linux permissions issues with the serial console, but if you're
on linux, you're probably used to that.

It will also change your workspace's default `board.pyi` file for autocomplete
to the one that matches the USB Vendor ID & Product ID.

If you want to manually choose a different board, a list is available with the
command `CircuitPython: Choose CircuitPython Board`, and also by clicking on the
board name in the status bar.

### Auto Complete

Automatically adds stubs for your specific board, the circuitpython standard
library and all py source files in the adafruit bundle to your completion path.

### Demo

![Demo](images/circuitpy-demo.gif)

## TODO

* Only tested so far on macOS 10.15


## Future Work

* Refactor as I learn more about VSCode Extensions & Typescript
* Allow board settings to persist in workspace settings
  - include circuit python version
* Automate the platform specific binding stuff
* Manually check for new Adafruit Bundle
* Share library state in globalState, only managing it once per all
  vscode workspaces
* Quick open Adafruit Bundle examples
* Quick open readthedocs.io for a library


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
