var Channel = require('jschannel')
var frameboyant = require('frameboyant/frameboyant.contentWindow')();
var attachSenders = require('./attachSenders');
var attachReceivers = require('./attachReceivers');
var adaptFrameboyantForCoralUI = require('./adaptFrameboyantForCoralUI');
var adaptFrameboyantForIframeResizer = require('./adaptFrameboyantForIFrameResizer');

var bridge = {};

var channel = Channel.build({
  window: parent,
  origin: '*',
  scope: 'extensionBridge'
});

attachSenders(bridge, channel);
attachReceivers(bridge, channel);

adaptFrameboyantForCoralUI(frameboyant);
adaptFrameboyantForIframeResizer(frameboyant);

bridge.requestFrontLock = frameboyant.requestFrontLock;
bridge.releaseFrontLock = frameboyant.releaseFrontLock;

window.extensionBridge = bridge;
