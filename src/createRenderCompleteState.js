// When promises land natively we should probably use them. We're doing this instead of importing
// a promise library.
module.exports = function(onInitialRenderComplete) {
  var domReady = false;
  var stylesReady = false;
  var iframeResizerReady = false;

  var callHandlerIfComplete = function(handler) {
    if (domReady && stylesReady && iframeResizerReady && handler) {
      handler();
    }
  };

  var callOnInitalRenderComplete = function() {
    callHandlerIfComplete(onInitialRenderComplete);
  }

  return {
    callHandlerIfComplete: callHandlerIfComplete,
    reset: function() {
      domReady = false;
      stylesReady = false;
      iframeResizerReady = false;
    },
    markDomReady: function() {
      domReady = true;
      callOnInitalRenderComplete();
    },
    markStylesReady: function() {
      stylesReady = true;
      callOnInitalRenderComplete();
    },
    markIframeResizerReady: function(){
      if (!iframeResizerReady) {
        iframeResizerReady = true;
        callOnInitalRenderComplete();
      }
    }
  };
};
