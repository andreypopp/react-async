BIN = ./node_modules/.bin
SRC = $(shell find src -name '*.js')
LIB = $(SRC:src/%=lib/%)

BABEL_OPTS = \
	--stage 0

TEST_SUITES         = $(wildcard ./src/__tests__/*.js)
TEST_SUITES_COMMON  = $(filter-out %-browser-test.js %-server-test.js, $(TEST_SUITES))
TEST_SUITES_BROWSER = $(filter %-browser-test.js, $(TEST_SUITES))
TEST_SUITES_SERVER  = $(filter %-server-test.js, $(TEST_SUITES))

build: $(LIB)

example::
	@$(BIN)/babel-node $(BABEL_OPTS) ./example/server.js

install link:
	@npm $@

test:: test-server test-browser

test-server::
	@$(BIN)/mocha \
		-R dot \
		--compilers js:./scripts/register-babel \
		$(TEST_SUITES_COMMON) \
		$(TEST_SUITES_SERVER)

ci-server::
	@$(BIN)/mocha \
		--watch \
		-R dot \
		--compilers js:./scripts/register-babel \
		$(TEST_SUITES_COMMON) \
		$(TEST_SUITES_SERVER)

test-browser::
	@$(BIN)/mochify \
		--transform [ babelify $(BABEL_OPTS) ] \
		$(TEST_SUITES_COMMON) \
		$(TEST_SUITES_BROWSER)

ci-browser:: build
	@$(BIN)/mochify \
		--watch \
		--transform [ babelify $(BABEL_OPTS) ] \
		$(TEST_SUITES_COMMON:lib/%=./src/%) \
		$(TEST_SUITES_BROWSER:lib/%=./src/%)

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
	@$(BIN)/babel $(BABEL_OPTS) --source-maps-inline -o $@ $<

clean:
	@rm -f $(LIB)

define release
	npm version $(1)
endef
