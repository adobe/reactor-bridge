import domready from 'domready';

// List of events that could potentially change content without triggering a mutation observer.
// Inspired by
// https://github.com/davidjbradshaw/iframe-resizer/blob/86daa57745f630385e3eb6b03af02dac49d8b777/src/iframeResizer.contentWindow.js#L291-L310
var contentPositionChangingEvents = [
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

  const observe = function() {
    if (!observing) {
      observing = true;
      domready(() => {
        // If _observe() was called before dom was ready, then _disconnect() was called, then dom
        // became ready, we should not proceed.
        if (!observing) {
          return;
        }

        mutationObserver.observe(document.body, {
          attributes: true,
          attributeOldValue: false,
          characterData: true,
          characterDataOldValue: false,
          childList: true,
          subtree: true
        });

        contentPositionChangingEvents.forEach(eventType => {
          window.addEventListener(eventType, callHandlers);
        });

        // Load events don't bubble so we must use capture.
        // We can't add the event to window because "For legacy reasons, load events for
        // resources inside the document (e.g., images) do not include the Window in the
        // propagation path in HTML implementations"
        document.body.addEventListener('load', loadHandler, true);
      });
    }
  };

  const disconnect = () => {
    if (observing) {
      observing = false;

      domready(() => {
        // If _disconnect() was called before dom was ready, then _observe() was called, then dom
        // became ready, we should not proceed.
        if (observing) {
          return;
        }

        mutationObserver.disconnect();

        contentPositionChangingEvents.forEach(eventType => {
          window.removeEventListener(eventType, callHandlers);
        });

        document.body.removeEventListener('load', loadHandler, true);
      })
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
