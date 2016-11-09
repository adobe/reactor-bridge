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
  }

  /*
    Toggling edit mode is an asynchronous operation due to postMessage being asynchronous. While
    toggling, the iframe gets shifted around the parent document at times causing the user to
    see the iframe's content moving around the page. To prevent this from happening, we'll hide
    the body which hopefully will be a better form a flicker.
  */
  .frameboyantTogglingEditMode {
    visibility: hidden !important;
  }
`;

let parent;
let editMode = false;

const preventEvent = event => {
  event.preventDefault();
  event.stopPropagation();
};

const isSimulatedClickEvent = event => event.frameboyantSimulated;

const createSimulatedClickEvent = () => {
  const simulatedClickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true
  });

  simulatedClickEvent.frameboyantSimulated = true;

  return simulatedClickEvent;
};

const handleMouseDown = event => {
  console.log('handle click');
  if (editMode) {
    if (event.target === document.documentElement && !isSimulatedClickEvent(event)) {
      exitEditMode();
    }
  } else {
    // We prevent the click until edit mode has been entered and then re-trigger it. We do this
    // because the click may be, for example, triggering a popover. The popover will possibly
    // have a calculation to determine the best placement due to how much space is around it.
    // We want to make sure we've already entered edit mode by the time this calculation is made
    // so it can have the full edit mode area to consider.
    // const clickTarget = event.target;
    // preventEvent(event);
    enterEditMode().then(() => {
      // clickTarget.dispatchEvent(createSimulatedClickEvent());
    });
  }
};

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

const enterEditMode = () => {
  if (parent && !editMode) {
    logger.log('entering edit mode');
    editMode = true;
    document.body.classList.add('frameboyantTogglingEditMode');

    return parent.editModeEntered().then(contentRect => {
      setContentRect(contentRect);
      document.body.classList.remove('frameboyantTogglingEditMode');
    });
  }
};

const exitEditMode = () => {
  if (parent && editMode) {
    logger.log('exiting edit mode');
    editMode = false;
    document.body.classList.add('frameboyantTogglingEditMode');

    parent.editModeExited().then(() => {
      clearContentRect();
      document.body.classList.remove('frameboyantTogglingEditMode');
    });
  }
};

const handleUIChange = (() => {
  let lastObservedHeight = -1;

  return () => {
    const bodyHeight = document.body.offsetHeight;
    if (lastObservedHeight !== bodyHeight) {
      if (parent) {
        parent.setIframeHeight(bodyHeight);
      }

      lastObservedHeight = bodyHeight;
    }
  };
})();

const uiObserver = new UIObserver(handleUIChange);

const setParent = once(value => {
  parent = value;
  uiObserver.observe();
  handleUIChange(); // Let the parent know about our initial height.
});

// document.addEventListener('click', handleClick, true);
document.addEventListener('mousedown', handleMouseDown, true);
// TODO: Fix. document.addEventListener('focus', enterEditMode, true);
addStylesToPage(STYLES);

export default {
  setParent,
  setContentRect,
  exitEditMode
};
