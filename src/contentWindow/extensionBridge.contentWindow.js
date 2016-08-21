var Channel = require('@reactor/jschannel');
var frameboyantBuilder = require('@reactor/frameboyant/frameboyant.contentWindow');
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var adaptFrameboyantForIframeResizer = require('./adaptFrameboyantForIframeResizer');

var registeredOptions = {};

var channel = Channel.build({
  window: parent,
  origin: '*',
  scope: 'extensionBridge'
});

//reset
channel.notify({
  method: 'resetWindow',
  error: function(name, message) {
    console.error('An error occurred while triggering resetWindow.', name, message);
  }
});

var frameboyant = frameboyantBuilder();

adaptFrameboyantForIframeResizer(frameboyant);

document.addEventListener("DOMContentLoaded", function(event) {
  channel.notify({
    method: 'domReady',
    error: function(name, message) {
      console.error('An error occurred while triggering domReady.', name, message);
    }
  });
});

var channelSenders = getChannelSenders(channel);

attachChannelReceivers(channel, {
  init: function(transaction, options) {
    if (registeredOptions.init) {
      try {
        registeredOptions.init(options);
      } catch (error) {
        console.error('Error initializing', error.stack);
      }
    } else {
      console.error('You must register an init function using extensionBridge.register().');
    }
  },
  validate: function() {
    if (registeredOptions.validate) {
      var result;

      try {
        result = registeredOptions.validate();
      } catch (error) {
        console.error('Error validating', error.stack);
      }

      return result;
    } else {
      console.error('You must register a validate function using extensionBridge.register().');
    }
  },
  getSettings: function() {
    if (registeredOptions.getSettings) {
      var result;

      try {
        result = registeredOptions.getSettings();
      } catch (error) {
        console.error('Error getting settings', error.stack);
      }

      return result;
    } else {
      console.error('You must register a getSettings function using extensionBridge.register().');
    }
  }
});

window.extensionBridge = {
  requestFrontLock: frameboyant.requestFrontLock,
  releaseFrontLock: frameboyant.releaseFrontLock,
  openCodeEditor: channelSenders.openCodeEditor,
  openDataElementSelector: channelSenders.openDataElementSelector,
  openRegexTester: channelSenders.openRegexTester,
  register: function(options) {
    Object.keys(options).forEach(function(key) {
      registeredOptions[key] = options[key];
    });
  }
};
