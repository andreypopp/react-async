.DELETE_ON_ERROR:

BIN = ../node_modules/.bin
PATH := $(BIN):$(PATH)
NAME = ReactAsync

build: \
	react-async.js \
	react-async.min.js

react-async.prod.js: prelude.js index.js lib/*.js
	@mkdir -p $(@D)
	@cat ./prelude.js > $@
	@NODE_ENV=production browserify \
		--transform browserify-shim \
		--standalone $(NAME) \
		./ >> $@

react-async.min.js: react-async.prod.js
	@cat $< | uglifyjs -cm > $@

react-async.js: prelude.js index.js lib/*.js
	@mkdir -p $(@D)
	@cat ./prelude.js > $@
	@NODE_ENV=development browserify \
		--transform browserify-shim \
		--standalone $(NAME) \
		./ >> $@

clean:
	@rm -f \
		react-async.js \
		react-async.prod.js \
		react-async.min.js
