import addStylesToPage from '../utils/addStylesToPage';
import Logger from '../utils/logger';
import UIObserver from '../utils/uiObserver';

const logger = new Logger('Frameboyant:Child');

const STYLES = `
  html {
    margin: 0 !important;
    
    /*
      When something in the iframe changes the document height, we send a message to the parent
      window and the window resizes the iframe accordingly. This process is asynchronous,
      however, and while the message is being communicated to the parent window, a vertical
      scrollbar appears. This prevents the scrollbar for showing up.
    */
    overflow: hidden;
  }
  
  html, body {
    background-color: transparent !important;
  }
  
  body {
    /* 
       When in edit mode, we'll be giving body some margin. If the children of body also have 
       margin, this can cause the margins to "collapse" into each other. 
       https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing.
       Using padding of 0.1px prevents margins from collapsing while (hopefully) not causing any
       problematic side-effects.
    */
    padding: 0.1px !important;
    
    margin: 0 !important;
    display: block !important;
    position: relative !important;
    height: 100% !important;
  };`;


let uiObserver;

const preventEvent = event => {
  event.preventDefault();
  event.stopPropagation();
};

// We want to try to be the first to add an event listener for click events so we do it ASAP.
// While we're establishing communication with the parent window, we'll just prevent any click
// event. Once communication is established, we'll override onClick with a more useful handler.
let onClick = preventEvent;
document.addEventListener('click', event => {
  onClick(event);
}, true);

addStylesToPage(STYLES);

const setContentRect = rect => {
  const bodyStyle = document.body.style;
  // We subtract 1 from margin to accommodate for the transparent border on body.
  // See the docs in the body style block above.
  bodyStyle.setProperty('margin-top', `${rect.top}px`, 'important');
  bodyStyle.setProperty('margin-left', `${rect.left}px`, 'important');
  bodyStyle.setProperty('width', `${rect.width}px`, 'important');
  logger.log('content rect set', rect);
};

const clearContentRect = () => {
  const bodyStyle = document.body.style;
  bodyStyle.removeProperty('margin-top');
  bodyStyle.removeProperty('margin-left');
  bodyStyle.removeProperty('width');
  logger.log('content rect cleared');
};

export default {
  setParent(parent) {
    let editMode = false;

    let lastObservedHeight = -1;

    const handleUIChange = () => {
      const bodyHeight = document.body.offsetHeight;
      if (lastObservedHeight !== bodyHeight) {
        parent.setIframeHeight(bodyHeight);
      }
    };

    uiObserver = new UIObserver(handleUIChange);
    uiObserver.observe();
    handleUIChange(); // get this party started

    onClick = event => {
      if (editMode) {
        if (event.target === document.documentElement && !event.frameboyantSimulated) {
          logger.log('deactivating edit mode');
          editMode = false;

          parent.deactivateEditMode().then(() => {
            clearContentRect();

            // Enable iframeResizer.
            // window.parentIFrame.autoResize(true);
          });
        }
      } else {
        logger.log('activating edit mode');
        editMode = true;

        const clickTarget = event.target;
        preventEvent(event);

        // Disable iframeResizer.
        // window.parentIFrame.autoResize(false);

        parent.activateEditMode().then(contentRect => {
          setContentRect(contentRect);

          const simulatedClickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });

          simulatedClickEvent.frameboyantSimulated = true;

          clickTarget.dispatchEvent(simulatedClickEvent);

          logger.log('edit mode activated');
        });
      }
    };
  },
  setContentRect
};
