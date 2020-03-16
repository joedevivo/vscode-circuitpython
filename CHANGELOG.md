# Change Log

All notable changes to the "vscode-circuitpython" extension will be documented in this file.

## [0.0.2]

- Rebuilt for Electron@7
- Reimplemented circup features directly in the extension, see libraryManager.ts for details
  - moves older bunldes to the Trash instead of deleting.
- Fixed OS dependent paths ( removed direct calls to path.posix )
- In theory, native bindings should work for windows and mac
  - no linux support yet, but it's on the way. I need to streamline the very
    manual process it took to get these bindings done.

## [0.0.1]

- Initial release