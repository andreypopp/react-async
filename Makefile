BIN = ./node_modules/.bin

TEST_SUITES         = $(wildcard ./tests/*.js)
TEST_SUITES_COMMON  = $(filter-out %-browser.js %-server.js, $(TEST_SUITES))
TEST_SUITES_BROWSER = $(filter %-browser.js, $(TEST_SUITES))
TEST_SUITES_SERVER  = $(filter %-server.js, $(TEST_SUITES))

install link:
	@npm $@

lint:
	@$(BIN)/jshint --verbose *.js lib/*.js

test:: test-server test-browser

test-server::
	@$(BIN)/mocha -R dot $(TEST_SUITES_COMMON) $(TEST_SUITES_SERVER)

test-browser:
	@$(BIN)/mochify $(TEST_SUITES_COMMON) $(TEST_SUITES_BROWSER) \

example::
	@$(BIN)/node-dev --no-deps example/server.js

release-patch: test lint
	@$(call release,patch)

release-minor: test lint
	@$(call release,minor)

release-major: test lint
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

define release
	npm version $(1)
endef
