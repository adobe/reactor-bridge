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

  bridge.getConfig = function() {console.error('You must define extensionBridge.getConfig'); };
  channel.bind('getConfig', function() {
    var result;

    try {
      result = bridge.getConfig();
    } catch (error) {
      console.error('Error getting config', error.stack);
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
