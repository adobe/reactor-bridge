/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2016 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property
* laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

import LayoutObserver from 'layout-observer';
import addStylesToPage from '../utils/addStylesToPage';
import Logger from '../utils/logger';
import once from 'once';

const logger = new Logger('Frameboyant:Child');

const STYLES = `
  html {
    margin: 0 !important;
    
    /*
      When something in the iframe changes the document height, we send a message to the parent
      window and the window resizes the iframe accordingly. This process is asynchronous,
      however, and while the message is being communicated to the parent window, a vertical
      scrollbar appears. This prevents the scrollbar from showing up.
    */
    overflow: hidden !important;
  }
  
  html, body {
    /*
      Prevent infinite resizing
    */
    height: auto !important;
    background-color: transparent !important;
  }
  
  body {
    /*
      border-box sizing is important to get body sizing right when the extension has applied
      padding to the body element.
    */
    box-sizing: border-box !important;
    margin: 0 !important;
    display: block !important;
    position: relative !important;
    height: 100% !important;
  }
  
  /* 
    When in edit mode, we'll be giving body some margin. If the children of body also have 
    margin, this can cause their margins to "collapse" into the body's margin. 
    https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing.
    This hack prevents margins from collapsing while (hopefully) not causing any
    problematic side-effects.
  */
  body:before,
  body:after {
    content: ' ';
    display: table;
  }

  /*
    Toggling edit mode is an asynchronous operation due to postMessage being asynchronous. While
    toggling, the iframe gets shifted around the parent document at times causing the user to
    see the iframe's content moving around the page. To prevent this from happening, we'll hide
    the body which hopefully will be a better form of flicker. We tried setting visibility to 
    hidden, but it appeared to cause issues with React synthetic events (mousedown, blur, etc)
    after it was unhidden. Tweaking opacity is our best attempt at hiding the content 
    without causing problems.
  */
  .frameboyantTogglingEditMode {
    opacity: 0 !important;
  }
`;

let parent;
let editMode = false;

const handleMouseDown = event => {
  if (event.button === 0) { // main mouse button
    if (editMode) {
      if (event.target === document.documentElement) {
        exitEditMode();
      }
    } else {
      enterEditMode();
    }
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

const handleLayoutChange = (() => {
  let previousObservedHeight = -1;

  return () => {
    const bodyHeight = document.body.offsetHeight;
    if (previousObservedHeight !== bodyHeight) {
      if (parent) {
        parent.setIframeHeight(bodyHeight);
      }

      previousObservedHeight = bodyHeight;
    }
  };
})();

const layoutObserver = new LayoutObserver(handleLayoutChange, {
  throttle: 10
});

const setParent = once(value => {
  parent = value;
  layoutObserver.observe();
  handleLayoutChange(); // Let the parent know about our initial height.
});

document.addEventListener('mousedown', handleMouseDown, true);
document.addEventListener('focus', enterEditMode, true);
addStylesToPage(STYLES);

export default {
  /**
   * Provides frameboyant with an API object for managing the parent window.
   * @param value
   */
  setParent,
  /**
   * Provides top, left, and width for where the content should be oriented inside the iframe.
   */
  setContentRect,
  /**
   * Called when the parent window wishes to enter edit mode.
   */
  enterEditMode,
  /**
   * Called when the parent window wishes to exit edit mode.
   */
  exitEditMode
};
