module.exports = function(bridge, channel) {
  bridge.openCodeEditor = function() {
    console.error('You must define extensionBridge.openCodeEditor');
  };

  channel.bind('openCodeEditor', function(trans, params) {
    bridge.openCodeEditor(params, trans.complete);
    trans.delayReturn(true);
  });

  bridge.openRegexTester = function() {
    console.error('You must define extensionBridge.openRegexTester');
  };

  channel.bind('openRegexTester', function(trans, params) {
    bridge.openRegexTester(params, trans.complete);
    trans.delayReturn(true);
  });

  bridge.openDataElementSelector = function() {
    console.error('You must define extensionBridge.openDataElementSelector');
  };

  channel.bind('openDataElementSelector', function(trans) {
    bridge.openDataElementSelector(trans.complete);
    trans.delayReturn(true);
  });
};
