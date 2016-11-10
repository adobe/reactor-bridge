// List of events that could potentially change UI layout without triggering a mutation observer.
// Inspired by https://github.com/davidjbradshaw/iframe-resizer/blob/86daa57745f630385e3eb6b03af02dac49d8b777/src/iframeResizer.contentWindow.js#L291-L310
var uiChangeEvents = [
  'animationstart',
  'webkitAnimationStart',
  'animationiteration',
  'webkitAnimationIteration',
  'animationend',
  'webkitAnimationEnd',
  'input',
  'mouseup',
  'mousedown',
  'orientationchange',
  'afterprint',
  'beforeprint',
  'readystatechange',
  'touchstart',
  'touchend',
  'touchcancel',
  'transitionstart',
  'webkitTransitionStart',
  'MSTransitionStart',
  'oTransitionStart',
  'otransitionstart',
  'transitioniteration',
  'webkitTransitionIteration',
  'MSTransitionIteration',
  'oTransitionIteration',
  'otransitioniteration',
  'transitionend',
  'webkitTransitionEnd',
  'MSTransitionEnd',
  'oTransitionEnd',
  'otransitionend'
];

const masterObserver = (() => {
  let observing = false;
  const connectedHandlers = [];

  const callHandlers = function() {
    connectedHandlers.forEach(handler => {
      handler();
    });
  };

  const mutationObserver = new MutationObserver(callHandlers);

  const loadHandler = function(event) {
    const target = event.target;
    if (target.tagName === 'IMG') {
      callHandlers();
    }
  };

  const hasDOMContentLoaded = () =>
    document.readyState === 'interactive' || document.readyState === 'complete';

  const startObservations = () => {
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeOldValue: false,
      characterData: true,
      characterDataOldValue: false,
      childList: true,
      subtree: true
    });

    uiChangeEvents.forEach(eventType => {
      window.addEventListener(eventType, callHandlers);
    });

    // Watch for images and similar resources to load. Load events don't bubble so we must
    // use capture. We can't add the event listener to body because "For legacy reasons, load
    // events for resources inside the document (e.g., images) do not include the Window in the
    // propagation path in HTML implementations"
    document.body.addEventListener('load', loadHandler, true);
  };

  const domContentLoadedHandler = () => {
    startObservations();
    callHandlers();
  };

  const observe = function() {
    if (!observing) {
      observing = true;

      if (hasDOMContentLoaded()) {
        startObservations();
      } else {
        // When the DOM content has loaded, we can start observations because we have access to
        // the necessary DOM element
        document.addEventListener('DOMContentLoaded', domContentLoadedHandler);
      }
    }
  };

  const disconnect = () => {
    if (observing) {
      observing = false;

      mutationObserver.disconnect();

      document.removeEventListener('DOMContentLoaded', domContentLoadedHandler);

      uiChangeEvents.forEach(eventType => {
        window.removeEventListener(eventType, callHandlers);
      });

      if (document.body) { // In case disconnect is called before DOMContentLoaded.
        document.body.removeEventListener('load', loadHandler, true);
      }
    }
  };

  return {
    connectHandler(handler) {
      if (connectedHandlers.indexOf(handler) === -1) {
        connectedHandlers.push(handler);
      }

      observe();
    },
    disconnectHandler(handler) {
      const index = connectedHandlers.indexOf(handler);

      if (index !== -1) {
        connectedHandlers.splice(index, 1);

        if (!connectedHandlers.length) {
          disconnect();
        }
      }
    }
  };
})();

const UIObserver = function(handler) {
  this.handler = handler;
};

UIObserver.prototype.observe = function() {
  masterObserver.connectHandler(this.handler);
};

UIObserver.prototype.disconnect = function() {
  masterObserver.disconnectHandler(this.handler);
};

export default UIObserver;
