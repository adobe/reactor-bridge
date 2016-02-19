var Channel = require('jschannel');
var frameboyant = require('@reactor/frameboyant/frameboyant.contentWindow');
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var adaptFrameboyantForCoralUI = require('./adaptFrameboyantForCoralUI');
var adaptFrameboyantForIframeResizer = require('./adaptFrameboyantForIframeResizer');

var bridge = {};

var channel = Channel.build({
  window: parent,
  origin: '*',
  scope: 'extensionBridge'
});

document.addEventListener("DOMContentLoaded", function(event) {
  channel.notify({
    method: 'domReady',
    error: function(name, message) {
      console.error('An error occurred while triggering domReady.', name, message);
    }
  });
});

var channelSenders = getChannelSenders(channel);

bridge.openCodeEditor = channelSenders.openCodeEditor;
bridge.openDataElementSelector = channelSenders.openDataElementSelector;
bridge.openRegexTester = channelSenders.openRegexTester;

attachChannelReceivers(channel, {
  init: function(transaction, options) {
    if (bridge.init) {
      try {
        bridge.init(options);
      } catch (error) {
        console.error('Error initializing', error.stack);
      }
    } else {
      console.error('You must define extensionBridge.init');
    }
  },
  validate: function() {
    if (bridge.validate) {
      var result;

      try {
        result = bridge.validate();
      } catch (error) {
        console.error('Error validating', error.stack);
      }

      return result;
    } else {
      console.error('You must define extensionBridge.validate');
    }
  },
  getSettings: function() {
    if (bridge.getSettings) {
      var result;

      try {
        result = bridge.getSettings();
      } catch (error) {
        console.error('Error getting settings', error.stack);
      }

      return result;
    } else {
      console.error('You must define extensionBridge.getSettings');
    }
  }
});

adaptFrameboyantForCoralUI(frameboyant);
adaptFrameboyantForIframeResizer(frameboyant);

bridge.requestFrontLock = frameboyant.requestFrontLock;
bridge.releaseFrontLock = frameboyant.releaseFrontLock;

window.extensionBridge = bridge;
