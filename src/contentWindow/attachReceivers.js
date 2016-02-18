module.exports = function(bridge, channel) {
  bridge.validate = function() {console.error('You must define extensionBridge.validate'); };
  channel.bind('validate', function() {
    var result;

    try {
      result = bridge.validate();
    } catch (error) {
      console.error('Error validating', error.stack);
    }

    return result;
  });

  bridge.getSettings = function() {console.error('You must define extensionBridge.getSettings'); };
  channel.bind('getSettings', function() {
    var result;

    try {
      result = bridge.getSettings();
    } catch (error) {
      console.error('Error getting settings', error.stack);
    }

    return result;
  });

  bridge.init = function() {console.error('You must define extensionBridge.init'); };
  channel.bind('init', function(transaction, options) {
    try {
      bridge.init(options);
    } catch (error) {
      console.error('Error setting config', error.stack);
    }
  });
};
