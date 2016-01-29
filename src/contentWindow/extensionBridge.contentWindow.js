var Channel = require('jschannel')
var frameboyant = require('frameboyant/frameboyant.contentWindow')();
var attachSenders = require('./attachSenders');
var attachReceivers = require('./attachReceivers');
var adaptFrameboyantForCoralUI = require('./adaptFrameboyantForCoralUI');

var bridge = {};

var channel = Channel.build({
  window: parent,
  origin: '*',
  scope: 'extensionBridge'
});

attachSenders(bridge, channel);
attachReceivers(bridge, channel);

adaptFrameboyantForCoralUI(frameboyant);

frameboyant.stylesAppliedCallback = function() {
  channel.notify({
    method: 'initialRenderComplete'
  });

  // If using the iframe-resizer lib, tell it that it needs to resize the iframe since it won't
  // automatically detect that the styles have been updated.
  if ('parentIFrame' in window) {
    parentIFrame.size();
  }
};

bridge.requestFrontLock = frameboyant.requestFrontLock;
bridge.releaseFrontLock = frameboyant.releaseFrontLock;

window.extensionBridge = bridge;
