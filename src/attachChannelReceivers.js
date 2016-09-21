module.exports = function(channel, options) {
  channel.bind('domReady', function() {
    options.domReadyCallback();
  });

  channel.bind('resetWindow', function() {
    options.resetIframeWindow();
  });

  channel.bind('openCodeEditor', function(trans, params) {
    options.openCodeEditor(params, trans.complete);
    trans.delayReturn(true);
  });

  channel.bind('openRegexTester', function(trans, params) {
    options.openRegexTester(params, trans.complete);
    trans.delayReturn(true);
  });

  channel.bind('openDataElementSelector', function(trans) {
    options.openDataElementSelector(trans.complete);
    trans.delayReturn(true);
  });

  channel.bind('openCssSelector', function(trans) {
    options.openCssSelector(trans.complete);
    trans.delayReturn(true);
  });
};
