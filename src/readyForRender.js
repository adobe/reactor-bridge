function checkRenderReady(iframe) {
  if (
    iframe.__DOMReady &&
    iframe.__stylesReady &&
    iframe.__bridge &&
    iframe.__bridge.initialRenderCompleteCallback
  ) {
    iframe.__bridge.initialRenderCompleteCallback();
  }
};

module.exports = {
  DOMReady: function(iframe) {
    iframe.__DOMReady = true;
    checkRenderReady(iframe);
  },
  stylesReady: function(iframe) {
    iframe.__stylesReady = true;
    checkRenderReady(iframe);
  }
}
