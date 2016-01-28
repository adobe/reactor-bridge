module.exports = function(bridge, channel) {
  bridge.openCodeEditor = function(code, callback) {
    channel.call({
      method: 'openCodeEditor',
      params: code,
      success: callback,
      error: function(name, message) {
        console.error('An error occurred while opening code editor.', name, message);
      }
    });
  };

  bridge.openDataElementSelector = function(callback) {
    channel.call({
      method: 'openDataElementSelector',
      success: callback,
      error: function(name, message) {
        console.error('An error occurred while opening data element selector.', name, message);
      }
    });
  };

  bridge.openRegexTester = function(regex, callback) {
    channel.call({
      method: 'openRegexTester',
      params: regex,
      success: callback,
      error: function(name, message) {
        console.error('An error occurred while opening regular expression tester.', name, message);
      }
    });
  };
};
