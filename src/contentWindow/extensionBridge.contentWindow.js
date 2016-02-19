var Channel = require('jschannel');
var frameboyant = require('@reactor/frameboyant/frameboyant.contentWindow');
var attachSenders = require('./attachSenders');
var attachReceivers = require('./attachReceivers');
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

attachSenders(bridge, channel);
attachReceivers(bridge, channel);

adaptFrameboyantForCoralUI(frameboyant);
adaptFrameboyantForIframeResizer(frameboyant);

bridge.requestFrontLock = frameboyant.requestFrontLock;
bridge.releaseFrontLock = frameboyant.releaseFrontLock;

window.extensionBridge = bridge;
