'use strict';
var attachSenders = require('./attachSenders');
var attachReceivers = require('./attachReceivers');
var Channel = require('jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('frameboyant/frameboyant')();

var channel;

module.exports = function(iframe) {
  if (channel) {
    channel.destroy();
  }
  
  channel = Channel.build({
    window: iframe.contentWindow,
    origin: '*',
    scope: 'extensionBridge'
  });

  var bridge = {};

  attachSenders(bridge, channel);
  attachReceivers(bridge, channel);

  frameboyant.addIframe(iframe);
  iframeResizer({checkOrigin: false}, iframe);

  bridge.destroy = function() {
    frameboyant.removeIframe(iframe);
    iframe.iFrameResizer.close();
  };

  return bridge;
};
