module.exports = function(channel, options) {
  channel.bind('validate', options.validate);
  channel.bind('getSettings', options.getSettings);
  channel.bind('init', options.init);
};
