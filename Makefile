#
# Project
#
package-lock.json:	package.json
	npm install
	touch $@
node_modules:		package-lock.json
	npm install
	touch $@
build:			node_modules
use-npm-holo-hash:
	npm uninstall @whi/holo-hash
	npm i --save @whi/holo-hash


#
# Testing
#
test:			build test-setup
	npx mocha --recursive ./tests
test-debug:		build test-setup
	LOG_LEVEL=silly npx mocha --recursive ./tests

test-unit:		build test-setup
	npx mocha ./tests/unit
test-unit-debug:	build test-setup
	LOG_LEVEL=silly npx mocha ./tests/unit

test-integration:	build test-setup
	npx mocha ./tests/integration
test-integration-debug:	build test-setup
	LOG_LEVEL=silly npx mocha ./tests/integration
test-setup:


#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx


#
# NPM
#
prepare-package:
	FILENAME=entity-architect.js WEBPACK_MODE=development npm run build
	npm run build
	gzip -kc dist/entity-architect.js dist/entity-architect.js.map			> dist/entity-architect.gz
	gzip -kc dist/entity-architect.prod.js dist/entity-architect.prod.js.map	> dist/entity-architect.prod.gz
preview-package:	clean-files test prepare-package
	npm pack --dry-run .
create-package:		clean-files test prepare-package
	npm pack .
publish-package:	clean-files test prepare-package
	npm publish --access public .
