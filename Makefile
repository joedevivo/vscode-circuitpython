.PHONY: find-native
find-native:
	@find node_modules -type f -name "*.node" 2>/dev/null | grep -v "obj\.target"

.PHONY: all
all:
	@npm install
	@npm run electron-rebuild
	@./scripts/build-stubs.sh
	@npx @vscode/vsce package
