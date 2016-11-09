import addStylesToPage from '../utils/addStylesToPage';
import UIObserver from '../utils/uiObserver';
import Logger from '../utils/logger';

const logger = new Logger('Frameboyant:Parent');

const STYLES = `
  .frameboyantIframe {
    box-sizing: border-box;
    width: 100%;
  }
  
  .frameboyantIframeContainer {
    width: 100%;
    height: 100%;
  }
    
  .frameboyantRoot.editMode .frameboyantIframeContainer {
    position: absolute;
    /* Width and height will be inlined as necessary */
    width: auto;
    height: auto;
  }
  
  .frameboyantIframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

addStylesToPage(STYLES);

/**
 * ...
 * @param element
 * @returns {{top: *, left: *, width: number, height: number}}
 */
const getDocumentOffsetRect = element => {
  const offsetParent = element.offsetParent;
  const elementStyle = getComputedStyle(offsetParent);
  const offsetParentRect = offsetParent.getBoundingClientRect();

  const top = window.pageYOffset + offsetParentRect.top +
    parseFloat(elementStyle.borderTopWidth);
  const left = window.pageXOffset + offsetParentRect.left +
    parseFloat(elementStyle.borderLeftWidth);
  const width = offsetParentRect.width - parseFloat(elementStyle.borderLeftWidth) -
    parseFloat(elementStyle.borderRightWidth);
  const height = offsetParentRect.height - parseFloat(elementStyle.borderTopWidth) -
    parseFloat(elementStyle.borderBottomWidth);

  return { top, left, width, height };
};

export default editModeZIndex => {
  logger.log('Initializing an iframe');

  let child;

  const root = document.createElement('div');
  root.classList.add('frameboyantRoot');

  const iframeContainer = document.createElement('div');
  iframeContainer.classList.add('frameboyantIframeContainer');
  root.appendChild(iframeContainer);

  const getIframeContentRect = () => {
    // const { top, left } = docOffset(root);
    const { width } = root.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();

    return {
      top: window.pageYOffset + rootRect.top,
      left: window.pageXOffset + rootRect.left,
      width,
    };
  };

  const updateDomForEditMode = () => {
    const iframeContainerStyle = iframeContainer.style;
    const offsetRect = getDocumentOffsetRect(iframeContainer);
    const docElement = document.documentElement;

    root.classList.add('editMode');
    iframeContainerStyle.zIndex = editModeZIndex;
    iframeContainerStyle.top = -offsetRect.top + 'px';
    iframeContainerStyle.left = -offsetRect.left + 'px';
    iframeContainerStyle.right =
      (offsetRect.left + offsetRect.width) - docElement.offsetWidth + 'px';
    iframeContainerStyle.bottom =
      (offsetRect.top + offsetRect.height) - docElement.offsetHeight + 'px';
  };

  const updateDomForNormalMode = () => {
    const iframeContainerStyle = iframeContainer.style;

    root.classList.remove('editMode');
    iframeContainerStyle.removeProperty('z-index');
    iframeContainerStyle.removeProperty('top');
    iframeContainerStyle.removeProperty('left');
    iframeContainerStyle.removeProperty('right');
    iframeContainerStyle.removeProperty('bottom');
  };

  // Watch for any UI mutations in the parent window. If any are seen, we need to update the
  // content position inside the iframe. This is only necessary when we're in edit mode.
  const uiObserver = new UIObserver(() => {
    logger.log('UI mutation observed');
    updateDomForEditMode();
    if (child) {
      child.setContentRect(getIframeContentRect());
    }
  });

  document.addEventListener('focus', () => {
    if (child) {
      child.exitEditMode();
    }
  }, true);

  return {
    root,
    iframeContainer,
    setChild(value) {
      child = value;
      child.iframe.classList.add('frameboyantIframe');
      iframeContainer.appendChild(child.iframe);
    },
    editModeEntered() {
      logger.log('Entering edit mode');
      updateDomForEditMode();
      uiObserver.observe();
      return getIframeContentRect();
    },
    editModeExited() {
      logger.log('Exiting edit mode');
      uiObserver.disconnect();
      updateDomForNormalMode();
    },
    setIframeHeight(height) {
      logger.log('Setting iframe height', height);
      root.style.height = height + 'px';
    },
    destroy() {
      uiObserver.disconnect();

      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }
  };
};
