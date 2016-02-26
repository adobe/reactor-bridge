// When promises land natively we should probably use them. We're doing this instead of importing
// a promise library.
module.exports = function(onInitialRenderComplete) {
  var domReady = false;
  var stylesReady = false;

  var callHandlerIfComplete = function() {
    if (domReady && stylesReady && onInitialRenderComplete) {
      onInitialRenderComplete();
    }
  };

  return {
    markDomReady: function() {
      domReady = true;
      callHandlerIfComplete();
    },
    markStylesReady: function() {
      stylesReady = true;
      callHandlerIfComplete();
    }
  };
};
