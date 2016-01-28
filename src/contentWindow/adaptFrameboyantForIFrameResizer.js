module.exports = function(frameboyant) {
  frameboyant.stylesAppliedCallback = function() {
    // If using the iframe-resizer lib, tell it that it needs to resize the iframe since it won't
    // automatically detect that the styles have been updated.
    if ('parentIFrame' in window) {
      parentIFrame.size();
    }
  };
};
