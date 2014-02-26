var assert                  = require('assert');
var ReactAsync              = require('../index');

describe('ReactAsync.injectIntoMarkup (server)', function() {
  it('injects data into markup', function() {
    var data = {foo: 'bar'};

    var markup = '<html><head></head><body>This is an injection test</body>';
    var injected = ReactAsync.injectIntoMarkup(markup, data);

    assert.ok(injected.indexOf('<script>window.__reactAsyncStatePacket={"foo":"bar"}</script></body>') > -1);
  })

  it('injects data and scripts into markup', function() {
    var data = {foo: 'bar'};
    var scripts = ['./a.js', './b.js'];

    var markup = '<html><head></head><body>This is another injection test</body>';
    var injected = ReactAsync.injectIntoMarkup(markup, data, scripts);

    assert.ok(injected.indexOf('<script>window.__reactAsyncStatePacket={"foo":"bar"}</script>') > -1)
    assert.ok(injected.indexOf('<script src="./a.js"></script>') > -1)
    assert.ok(injected.indexOf('<script src="./b.js"></script></body>') > -1)
  });

  it('appends data and scipt to markup if it does not contain <body> element', function() {
    var data = {foo: 'bar'};
    var markup = '<div>hello</div>';

    var injected = ReactAsync.injectIntoMarkup(markup, data);
    assert.ok(injected.indexOf(markup) > -1);
    assert.ok(injected.indexOf('<script>window.__reactAsyncStatePacket={"foo":"bar"}</script>') > -1);
  });
});
