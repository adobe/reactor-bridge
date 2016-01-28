module.exports = function(bridge, channel) {
  bridge.validate = function(callback) {
    channel.call({
      method: 'validate',
      success: callback,
      error: function(name, message) {
        console.error('An error occurred while validating.', name, message);
      }
    });
  };
  bridge.getConfig = function(callback) {
    channel.call({
      method: 'getConfig',
      success: callback,
      error: function(name, message) {
        console.error('An error occurred while getting config.', name, message);
      }
    });
  };
  bridge.init = function(options) {
    channel.notify({
      method: 'init',
      params: options,
      error: function(name, message) {
        console.error('An error occurred while initializing.', name, message);
      }
    });
  };
};
