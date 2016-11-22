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
  // Typically, boundsContainer contains offsetParent which contains root which contains
  // iframeContainer which contains iframe.

  // boundsContainer is the container that should be filled by the iframe while in edit mode.

  // offsetParent is the first ancestor of iframeContainer that has non-static positioning. When
  // iframeContainer is set to position:absolute, its top, right, bottom, and left positions will
  // be based on that. In other words, if iframeContainer has top: 0, right: 0, bottom: 0, left: 0,
  // it would be the same size as the offsetParent.

  // root is the parent-most container that frameboyant creates and controls. Its positioning will
  // always be static and its height will match the height of the iframe's content. In other words,
  // its height will not change when toggling edit mode.

  // iframeContainer contains the iframe and is toggled between absolute and static positioning
  // when going in and out of edit mode. When in edit mode, it will fill up the bounds container
  // and when not in edit mode it will fill up the root container. This container is only necessary
  // because browsers don't allow sizing an iframe using top, right, bottom, and left measurements.
  // Instead, we size the iframeContainer and set the iframe to 100% width and 100% height.

  // iframe The iframe. Since the iframe is 100% width and 100% height of iframeContainer, we
  // don't directly manipulate its positioning/sizing.
  const boundsContainerStyle = getComputedStyle(boundsContainer);
  const boundsContainerRect = boundsContainer.getBoundingClientRect();
  const offsetParent = iframeContainer.offsetParent;
  const offsetParentStyle = getComputedStyle(offsetParent);
  const offsetParentRect = offsetParent.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();

  // Find the top, left, right, and bottom styles that would need to be applied to the iframe
  // container in order to make the iframe cover the bounds container. The iframe should cover
  // everything in the bounds container except for the border.
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

  // Find the dimensions where the iframe's content should be. This will be sent into the iframe
  // and applied to the iframe's body.
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
  let exitEditModeOnFocus = true;

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

  const handleFocus = event => {
    // In at least IE 11, if something in the iframe gains focus, we'll get an event with iframe
    // as the target.
    if (exitEditModeOnFocus && child && event.target !== child.iframe) {
      child.exitEditMode();
    }
  };

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
      document.addEventListener('focus', handleFocus, true);
      return iframeContentRect;
    },
    editModeExited() {
      logger.log('Exiting edit mode');
      layoutObserver.disconnect();
      document.removeEventListener('focus', handleFocus, true);
      updateDomForNormalMode();
    },
    setIframeHeight(height) {
      logger.log('Setting iframe height', height);
      root.style.height = height + 'px';
    },
    destroy() {
      layoutObserver.disconnect();
      document.removeEventListener('focus', handleFocus, true);

      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    },
    setExitEditModeOnFocus(value) {
      exitEditModeOnFocus = value;
    }
  };
};
