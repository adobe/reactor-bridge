function checkRenderReady(iframe) {
  if (
    iframe.__domReady &&
    iframe.__stylesReady &&
    iframe.__bridge &&
    iframe.__bridge.initialRenderCompleteCallback
  ) {
    iframe.__bridge.initialRenderCompleteCallback();
  }
};

module.exports = {
  domReady: function(iframe) {
    iframe.__domReady = true;
    checkRenderReady(iframe);
  },
  stylesReady: function(iframe) {
    iframe.__stylesReady = true;
    checkRenderReady(iframe);
  }
}
