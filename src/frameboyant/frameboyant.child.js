import addStylesToPage from '../utils/addStylesToPage';
import Logger from '../utils/logger';
import UIObserver from '../utils/uiObserver';
import once from 'once';

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
    overflow: hidden !important;
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
  };

  /*
    Toggling edit mode is an asynchronous operation due to postMessage being asynchronous. While
    toggling, the iframe gets shifted around the parent document at times causing the user to
    see the iframe's content moving around the page. To prevent this from happening, we'll hide
    the body which hopefully will be a better form a flicker.
  */
  body.frameboyantTogglingEditMode {
    display: none !important;
  }
`;

addStylesToPage(STYLES);

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


const setContentRect = rect => {
  const bodyStyle = document.body.style;
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

const setParent = once(parent => {
  let editMode = false;

  let lastObservedHeight = -1;

  const handleUIChange = () => {
    const bodyHeight = document.body.offsetHeight;
    if (lastObservedHeight !== bodyHeight) {
      parent.setIframeHeight(bodyHeight);
      lastObservedHeight = bodyHeight;
    }
  };

  const uiObserver = new UIObserver(handleUIChange);
  uiObserver.observe();
  handleUIChange(); // Let the parent know about our initial height.

  onClick = event => {
    if (editMode) {
      if (event.target === document.documentElement && !event.frameboyantSimulated) {
        logger.log('deactivating edit mode');
        editMode = false;
        document.body.classList.add('frameboyantTogglingEditMode');

        parent.deactivateEditMode().then(() => {
          clearContentRect();
          document.body.classList.remove('frameboyantTogglingEditMode');
        });
      }
    } else {
      logger.log('activating edit mode');
      editMode = true;

      const clickTarget = event.target;
      preventEvent(event);
      document.body.classList.add('frameboyantTogglingEditMode');

      parent.activateEditMode().then(contentRect => {
        setContentRect(contentRect);
        document.body.classList.remove('frameboyantTogglingEditMode');

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
});

export default {
  setParent,
  setContentRect
};
