module.exports = function(frameboyant) {
  document.addEventListener('coral-overlay:open', frameboyant.requestFrontLock);
  document.addEventListener('coral-overlay:close', frameboyant.releaseFrontLock);

  // This is to handle the case where a Coral Overlay component is opened and gets added to or
  // removed from the DOM.
  document.addEventListener('coral-component:attached', function(event) {
    if (event.target instanceof Coral.Overlay) {
      if (event.target.open) {
        frameboyant.requestFrontLock();
      }

      event.target.addEventListener('coral-component:detached', function(event) {
        if (event.target.open) {
          frameboyant.releaseFrontLock();
        }
      });
    }
  });
}

