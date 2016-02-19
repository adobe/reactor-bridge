module.exports = function(channel) {
  return {
    init: function(options) {
      channel.notify({
        method: 'init',
        params: options,
        error: function(name, message) {
          console.error('An error occurred while initializing.', name, message);
        }
      });
    },
    validate: function(callback) {
      channel.call({
        method: 'validate',
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while validating.', name, message);
        }
      });
    },
    getSettings: function(callback) {
      channel.call({
        method: 'getSettings',
        success: callback,
        error: function(name, message) {
          console.error('An error occurred while getting settings.', name, message);
        }
      });
    }
  };
};
