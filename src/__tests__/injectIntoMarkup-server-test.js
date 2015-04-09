let assert                  = require('assert');
let ReactAsync              = require('../index');

describe('ReactAsync.injectIntoMarkup (server)', function() {

  let OLD_NODE_ENV;

  beforeEach(function() {
    OLD_NODE_ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  afterEach(function() {
    process.env.NODE_ENV = OLD_NODE_ENV;
  });

  it('injects data into markup', function() {
    let data = {foo: 'bar'};

    let markup = '<html><head></head><body>This is an injection test</body>';
    let injected = ReactAsync.injectIntoMarkup(markup, data);

    assert.ok(injected.indexOf('<script>window.__reactAsyncDataPacket__ = {"foo":"bar"}</script></body>') > -1);
  })

  it('injects data and scripts into markup', function() {
    let data = {foo: 'bar'};
    let scripts = ['./a.js', './b.js'];

    let markup = '<html><head></head><body>This is another injection test</body>';
    let injected = ReactAsync.injectIntoMarkup(markup, data, scripts);

    assert.ok(injected.indexOf('<script>window.__reactAsyncDataPacket__ = {"foo":"bar"}</script>') > -1)
    assert.ok(injected.indexOf('<script src="./a.js"></script>') > -1)
    assert.ok(injected.indexOf('<script src="./b.js"></script></body>') > -1)
  });

  it('appends data and scipt to markup if it does not contain <body> element', function() {
    let data = {foo: 'bar'};
    let markup = '<div>hello</div>';

    let injected = ReactAsync.injectIntoMarkup(markup, data);
    assert.ok(injected.indexOf(markup) > -1);
    assert.ok(injected.indexOf('<script>window.__reactAsyncDataPacket__ = {"foo":"bar"}</script>') > -1);
  });

  it('escapes HTML end tags in JSON before injecting into markup', function() {
    let data = {foo: '<script></script>'};
    let markup = '<html><head></head><body>Escape test</body>';
    let injected = ReactAsync.injectIntoMarkup(markup, data);
    assert.ok(injected.indexOf('<script><\\/script>') > -1);
  });

  it('escapes non-ascii characters', function() {
    let data = {foo: '☺'};

    let markup = '<html><head></head><body>This is an injection test</body>';
    let injected = ReactAsync.injectIntoMarkup(markup, data);

    assert.ok(injected.indexOf('<script>window.__reactAsyncDataPacket__ = {"foo":"\\u263a"}</script></body>') > -1);
  })
});
