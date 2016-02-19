'use strict';
var attachSenders = require('./attachSenders');
var attachReceivers = require('./attachReceivers');
var Channel = require('jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var stylesReady = require('./readyForRender').stylesReady;

frameboyant.stylesAppliedCallback = stylesReady;

module.exports = function(iframe) {
  if (iframe.__channel) {
    iframe.__channel.destroy();
  }

  var channel = Channel.build({
    window: iframe.contentWindow,
    origin: '*',
    scope: 'extensionBridge'
  });

  var bridge = {};

  attachSenders(bridge, channel);
  attachReceivers(bridge, channel, iframe);

  frameboyant.addIframe(iframe);
  iframeResizer({checkOrigin: false}, iframe);

  bridge.destroy = function() {
    frameboyant.removeIframe(iframe);
    iframe.iFrameResizer.close();

    delete iframe.__channel;
    delete iframe.__bridge;
  };

  iframe.__channel = channel;
  iframe.__bridge = bridge;

  return bridge;
};
