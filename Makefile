.PHONY: find-native
find-native: 
	@find node_modules -type f -name "*.node" 2>/dev/null | grep -v "obj\.target"

