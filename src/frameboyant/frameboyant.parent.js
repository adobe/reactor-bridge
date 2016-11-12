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

const getEditModeMeasurements = (iframeContainer, boundsContainer, root) => {
  const offsetParent = iframeContainer.offsetParent;
  const offsetParentStyle = getComputedStyle(offsetParent);
  const boundsContainerRect = boundsContainer.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const boundsContainerStyle = getComputedStyle(boundsContainer);
  const offsetParentRect = offsetParent.getBoundingClientRect();

  const iframeContainerMeasurements = {
    top:
      parseFloat(offsetParentStyle.borderTopWidth) +
      (offsetParentRect.top - boundsContainerRect.top) -
      parseFloat(boundsContainerStyle.borderTopWidth),
    left:
      parseFloat(offsetParentStyle.borderLeftWidth) +
      (offsetParentRect.left - boundsContainerRect.left) -
      parseFloat(boundsContainerStyle.borderLeftWidth),
    right:
      parseFloat(offsetParentStyle.borderRightWidth) +
      (boundsContainerRect.right - offsetParentRect.right) -
      parseFloat(boundsContainerStyle.borderRightWidth),
    bottom:
      parseFloat(offsetParentStyle.borderBottomWidth) +
      (boundsContainerRect.bottom - offsetParentRect.bottom) -
      parseFloat(boundsContainerStyle.borderBottomWidth)
  };

  const iframeContentMeasurements = {
    top:
      rootRect.top -
      boundsContainerRect.top -
      parseFloat(boundsContainerStyle.borderTopWidth),
    left:
      rootRect.left -
      boundsContainerRect.left -
      parseFloat(boundsContainerStyle.borderLeftWidth),
    width: root.clientWidth
  };

  return {
    iframeContainerMeasurements,
    iframeContentMeasurements
  };
};

export default ({ editModeBoundsContainer, editModeZIndex }) => {
  logger.log('Initializing an iframe');

  let child;

  const root = document.createElement('div');
  root.classList.add('frameboyantRoot');

  const iframeContainer = document.createElement('div');
  iframeContainer.classList.add('frameboyantIframeContainer');
  root.appendChild(iframeContainer);

  const updateDomForEditMode = () => {
    const iframeContainerStyle = iframeContainer.style;
    const {
      iframeContainerMeasurements,
      iframeContentMeasurements
    } = getEditModeMeasurements(iframeContainer, editModeBoundsContainer, root);

    // We have to be careful not to perform any of the operations below unless the values are
    // actually changing, otherwise they will trigger our mutation observer in at least Firefox
    // which causes an infinite loop.

    if (!root.classList.contains('editMode')) {
      root.classList.add('editMode');
    }

    const newZIndex = String(editModeZIndex);
    if (iframeContainerStyle.zIndex !== newZIndex) {
      iframeContainerStyle.zIndex = newZIndex;
    }

    Object.keys(iframeContainerMeasurements).forEach(side => {
      // Some browsers, like Firefox, do some rounding internally (to the tenth of a pixel) so
      // when we set a value of, say, "1.74939939057px", it's rounded internally to "1.7px".
      // Our mutation observer is triggered which brings us back into this function and because
      // "1.74939939057px" does not match "1.7px", we attempt to set the style again, which
      // continues the cycle, causing an infinite loop.
      const newMeasurement = Math.round(-iframeContainerMeasurements[side]) + 'px';
      if (iframeContainerStyle[side] !== newMeasurement) {
        iframeContainerStyle[side] = newMeasurement;
      }
    });

    return iframeContentMeasurements;
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
    if (child) {
      child.setContentRect(updateDomForEditMode());
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
      const iframeContentRect = updateDomForEditMode();
      layoutObserver.observe();
      return iframeContentRect;
    },
    editModeExited() {
      logger.log('Exiting edit mode');
      layoutObserver.disconnect();
      updateDomForNormalMode();
    },
    setIframeHeight(height) {
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
