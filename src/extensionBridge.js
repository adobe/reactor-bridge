'use strict';
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var Channel = require('jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var Promise = require('native-promise-only');

module.exports = function(iframe) {
  if (iframe.destroyExtensionBridge) {
    iframe.destroyExtensionBridge();
  }

  var resolveDomReadyPromise;
  var domReadyPromise = new Promise(function(resolve) {
    resolveDomReadyPromise = resolve;
  });

  var resolveStylesReadyPromise;
  var stylesReadyPromise = new Promise(function(resolve) {
    resolveStylesReadyPromise = resolve;
  });

  var channel = Channel.build({
    window: iframe.contentWindow,
    origin: '*',
    scope: 'extensionBridge'
  });

  var channelSenders = getChannelSenders(channel);

  var bridge = {
    init: channelSenders.init,
    validate: channelSenders.validate,
    getSettings: channelSenders.getSettings
  };

  attachChannelReceivers(channel, {
    domReadyCallback: resolveDomReadyPromise,
    openCodeEditor: function() {
      if (bridge.openCodeEditor) {
        bridge.openCodeEditor.apply(null, arguments);
      } else {
        console.error('You must define extensionBridge.openCodeEditor');
      }
    },
    openRegexTester: function() {
      if (bridge.openRegexTester) {
        bridge.openRegexTester.apply(null, arguments);
      } else {
        console.error('You must define extensionBridge.openRegexTester');
      }
    },
    openDataElementSelector: function() {
      if (bridge.openDataElementSelector) {
        bridge.openDataElementSelector.apply(null, arguments);
      } else {
        console.error('You must define extensionBridge.openDataElementSelector');
      }
    }
  });

  bridge.initialRenderComplete = Promise.all([
    stylesReadyPromise,
    domReadyPromise
  ]);

  frameboyant.addIframe(iframe, {
    stylesAppliedCallback: resolveStylesReadyPromise
  });

  iframeResizer({
    checkOrigin: false
  }, iframe);

  iframe.destroyExtensionBridge = bridge.destroy = function() {
    frameboyant.removeIframe(iframe);
    iframe.iFrameResizer.close();
    channel.destroy();
  };

  return bridge;
};
