var extensionBridge = require('lens-extension-bridge/src/extensionBridge');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('frameboyant/frameboyant')();

module.exports = function(iframe) {
  var equippedGoggles = extensionBridge(iframe);
  frameboyant.addIframe(iframe);
  iframeResizer({checkOrigin: false}, iframe);

  equippedGoggles.destroy = function() {
    frameboyant.removeIframe(iframe);
    iframe.iFrameResizer.close();
  };

  return equippedGoggles;
};
