'use strict';
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var Channel = require('jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var createRenderCompleteState = require('./createRenderCompleteState');

module.exports = function(iframe, options) {
  if (iframe.destroyExtensionBridge) {
    iframe.destroyExtensionBridge();
  }

  var renderCompleteState = createRenderCompleteState(options.onInitialRenderComplete);

  var channel = Channel.build({
    window: iframe.contentWindow,
    origin: '*',
    scope: 'extensionBridge'
  });

  var channelSenders = getChannelSenders(channel);

  attachChannelReceivers(channel, {
    domReadyCallback: renderCompleteState.markDomReady,
    openCodeEditor: function() {
      if (options.openCodeEditor) {
        options.openCodeEditor.apply(null, arguments);
      } else {
        console.error('You must define options.openCodeEditor');
      }
    },
    openRegexTester: function() {
      if (options.openRegexTester) {
        options.openRegexTester.apply(null, arguments);
      } else {
        console.error('You must define options.openRegexTester');
      }
    },
    openDataElementSelector: function() {
      if (options.openDataElementSelector) {
        options.openDataElementSelector.apply(null, arguments);
      } else {
        console.error('You must define options.openDataElementSelector');
      }
    }
  });

  frameboyant.addIframe(iframe, {
    stylesAppliedCallback: renderCompleteState.markStylesReady
  });

  iframeResizer({
    checkOrigin: false
  }, iframe);

  var destroyExtensionBridge = function() {
    frameboyant.removeIframe(iframe);
    // This also removes the iframe from its parent. Not really what we're going for
    // (we're just trying to clean up listeners and such) but not hurting anything at the moment.
    iframe.iFrameResizer.close();
    channel.destroy();
  };

  iframe.destroyExtensionBridge = destroyExtensionBridge;

  return {
    init: channelSenders.init,
    validate: channelSenders.validate,
    getSettings: channelSenders.getSettings,
    destroy: destroyExtensionBridge
  };
};
