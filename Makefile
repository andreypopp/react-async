BIN = ./node_modules/.bin
PATH := $(BIN):$(PATH)

TEST_SUITES         = $(wildcard tests/*.js)
TEST_SUITES_COMMON  = $(filter-out %-browser.js %-server.js, $(TEST_SUITES))
TEST_SUITES_BROWSER = $(filter %-browser.js, $(TEST_SUITES))
TEST_SUITES_SERVER  = $(filter %-server.js, $(TEST_SUITES))

install link:
	@npm $@

lint:
	@jshint --verbose *.js lib/*.js

test:: test-server test-browser

test-server::
	@mocha -R spec $(TEST_SUITES_COMMON) $(TEST_SUITES_SERVER)

test-browser:
	@browserify -d -p [ mocaccino -R spec ] \
		$(TEST_SUITES_COMMON) $(TEST_SUITES_BROWSER) \
		| phantomic

example::
	@node-dev --no-deps example/server.js

release-patch: test lint
	@$(call release,patch)

release-minor: test lint
	@$(call release,minor)

release-major: test lint
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

standalone::
	$(MAKE) -C standalone build

define release
	npm version $(1)
endef
