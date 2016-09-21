module.exports = function(channel) {
  return {
    openCodeEditor: function(code, callback) {
      channel.call({
        method: 'openCodeEditor',
        params: code,
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while opening code editor.', name, message);
        }
      });
    },
    openDataElementSelector: function(callback) {
      channel.call({
        method: 'openDataElementSelector',
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while opening data element selector.', name, message);
        }
      });
    },
    openCssSelector: function(callback) {
      channel.call({
        method: 'openCssSelector',
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while opening CSS selector.', name, message);
        }
      });
    },
    openRegexTester: function(regex, callback) {
      channel.call({
        method: 'openRegexTester',
        params: regex,
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while opening regular expression tester.', name, message);
        }
      });
    }
  };
};
