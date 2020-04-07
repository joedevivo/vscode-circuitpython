# Change Log

All notable changes to the "vscode-circuitpython" extension will be documented
in this file.

## [0.1.0]

- Reworked internals to be less `static`
- more robust autocomplete path handling
- updated stubs for Circuit Python 5.1.0
- new boards

## [0.0.5]

- Removed dialog on serial monitor open
- stores board info in settings.json, which has the effect of persisting your
  board choice for a project between sessions.
- Added command to manually check for bundle update

## [0.0.4]

- Refactored the serial monitor from an output channel to a terminal, allowing
  interaction with the Circuit Python REPL

## [0.0.3]

- More board completions

## [0.0.2]

- Rebuilt for Electron@7
- Reimplemented circup features directly in the extension, see libraryManager.ts for details
  - moves older bundles to the Trash instead of deleting.
- Fixed OS dependent paths ( removed direct calls to path.posix )
- In theory, native bindings should work for windows and mac
  - no linux support yet, but it's on the way. I need to streamline the very
    manual process it took to get these bindings done.

## [0.0.1]

- Initial release