BIN = ./node_modules/.bin
SRC = $(shell find src -name '*.js')
LIB = $(SRC:src/%=lib/%)

BABEL_OPTS = \
	--stage 0 \
	--optional runtime \
	--source-maps-inline

TEST_SUITES         = $(wildcard ./lib/__tests__/*.js)
TEST_SUITES_COMMON  = $(filter-out %-browser-test.js %-server-test.js, $(TEST_SUITES))
TEST_SUITES_BROWSER = $(filter %-browser-test.js, $(TEST_SUITES))
TEST_SUITES_SERVER  = $(filter %-server-test.js, $(TEST_SUITES))

build: $(LIB)

example: build
	@$(BIN)/babel-node --stage 0 --optional runtime ./example/server.js

install link:
	@npm $@

test:: test-server test-browser

test-server:: build
	@$(BIN)/mocha -R dot $(TEST_SUITES_COMMON) $(TEST_SUITES_SERVER)

test-browser:
	@$(BIN)/mochify $(TEST_SUITES_COMMON) $(TEST_SUITES_BROWSER)

release-patch: test lint
	@$(call release,patch)

release-minor: test lint
	@$(call release,minor)

release-major: test lint
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

lib/%.js: src/%.js
	@echo "building $@"
	@mkdir -p $(@D)
	@$(BIN)/babel $(BABEL_OPTS) -o $@ $<

clean:
	@rm -f $(LIB)

define release
	npm version $(1)
endef
