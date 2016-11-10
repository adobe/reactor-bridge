import LayoutObserver from 'layout-observer';
import addStylesToPage from '../utils/addStylesToPage';
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

    // We have to be careful not to perform any of the operations below unless the values are
    // actually changing, otherwise they will trigger our mutation observer in at least Firefox
    // which causes an infinite loop. Some browsers, like Firefox, also do some rounding internally
    // (to the tenth of a pixel) so when we set a value of, say, "1.74939939057px", it's rounded
    // internally to "1.7px". Our mutation observe is triggered which brings us back into this
    // function and because "1.74939939057px" does not match "1.7px", we attempt to set the style
    // again, which continues the cycle, causing an infinite loop.

    if (!root.classList.contains('editMode')) {
      root.classList.add('editMode');
    }

    const newZIndex = String(editModeZIndex);
    if (iframeContainerStyle.zIndex !== newZIndex) {
      iframeContainerStyle.zIndex = newZIndex;
    }

    const newTop = Math.round(-offsetRect.top) + 'px';
    if (iframeContainerStyle.top !== newTop) {
      iframeContainerStyle.top = newTop;
    }

    const newLeft = Math.round(-offsetRect.left) + 'px';
    if (iframeContainerStyle.left !== newLeft) {
      iframeContainerStyle.left = newLeft;
    }

    const newRight = Math.round(offsetRect.left + offsetRect.width - docElement.offsetWidth) + 'px';
    if (iframeContainerStyle.right !== newRight) {
      iframeContainerStyle.right = newRight;
    }

    const newBottom = Math.round(offsetRect.top + offsetRect.height - docElement.offsetHeight) + 'px';
    if (iframeContainerStyle.bottom !== newBottom) {
      iframeContainerStyle.bottom = newBottom;
    }
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
  const layoutObserver = new LayoutObserver(() => {
    logger.log('UI mutation observed');
    updateDomForEditMode();
    if (child) {
      const iframeContentRect = getIframeContentRect();
      child.setContentRect(iframeContentRect);
    }
  });

  document.addEventListener('focus', event => {
    // In at least IE 11, if something in the iframe gains focus, we'll get an event with iframe
    // as the target.
    if (child && event.target !== child.iframe) {
      child.exitEditMode();
    }
  }, true);

  return {
    root,
    iframeContainer,
    setChild(value) {
      child = value;
      child.iframe.classList.add('frameboyantIframe');
    },
    editModeEntered() {
      logger.log('Entering edit mode');
      updateDomForEditMode();
      layoutObserver.observe();
      return getIframeContentRect();
    },
    editModeExited() {
      logger.log('Exiting edit mode');
      layoutObserver.disconnect();
      updateDomForNormalMode();
    },
    setIframeHeight(height) {
      return;
      logger.log('Setting iframe height', height);
      root.style.height = height + 'px';
    },
    destroy() {
      layoutObserver.disconnect();

      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }
  };
};
