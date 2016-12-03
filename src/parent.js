import Penpal from 'penpal';
import Logger from './utils/logger';
import Frameboyant from './frameboyant/frameboyant.parent';

const CONNECTION_TIMEOUT_DURATION = 10000;
const RENDER_TIMEOUT_DURATION = 2000;

const logger = new Logger('ExtensionBridge:Parent');
const noop = () => {};

let Promise = window.Promise;

export const ERROR_CODES = {
  CONNECTION_TIMEOUT: 'connectionTimeout',
  RENDER_TIMEOUT: 'renderTimeout'
};

/**
 * An object providing bridge-related API.
 * @typedef {Object} IframeAPI
 * @property {Promise} The promise will be resolved once (1) communication with the iframe has
 * been established, (2) the iframe has been resized to its content, and (3) the iframe has
 * acknowledged receiving the initial init() call. The promise will be resolved
 * with an {IframeAPI} object that will act as the API to use to communicate with the iframe.
 * @property {HTMLIframeElement} iframe The created iframe. You may use this to add classes to the
 * iframe, etc.
 * @property {HTMLElement} rootNode A container the iframe sits within. This container is
 * needed in order for edit mode to work properly.
 * @property {Function} destroy Removes the iframe from its container and cleans up any supporting
 * utilities.
 */

/**
 * An API the consumer will use to call methods on the iframe.
 * @typedef {Object} IframeAPI
 * @property {Function} validate Validates the extension view.
 * @property {Function} getSettings Retrieves settings from the extension view.
 * @property {Function} enterEditMode Force the iframe to enter edit mode.
 * @property {Function} exitEditMode Force the iframe to exit edit mode.
 */

/**
 * Loads an extension iframe and connects all the necessary APIs.
 * @param {Object} options
 * @param {string} options.url The URL of the extension view to load.
 * @param {Object} [options.extensionInitOptions={}] The options to be passed to the initial init()
 * call on the extension view.
 * @param {HTMLElement} [options.container=document.body] The container DOM element to which the
 * extension iframe should be added.
 * @param {HTMLElement} [options.editModeBoundsContainer=document.documentElement] The container DOM
 * element that defines the bounds to which the iframe will be enlarged during edit mode.
 * @param {number} [options.editModeZIndex=1000] The z-index the iframe should be given when it is
 * in edit mode.
 * @param {Function} [options.editModeEntered] A function that will be called when edit mode
 * is entered.
 * @param {Function} [options.editModeExited] A function that will be called when edit mode
 * is exited.
 * @param {number} [options.connectionTimeoutDuration=10000] The amount of time, in milliseconds,
 * that must pass while attempting to establish communication with the iframe before rejecting
 * the returned promise with a CONNECTION_TIMEOUT error code.
 * @param {number} [options.renderTimeoutDuration=2000] The amount of time, in milliseconds,
 * that must pass while attempting to render the iframe before rejecting the returned promise
 * with a RENDER_TIMEOUT error code. This duration begins after communication with the iframe
 * has been established.
 * @param {Function} [options.openCodeEditor] The function to call when the extension view requests
 * that the code editor should open. The function may be passed existing code and should return
 * a promise to be resolved with updated code.
 * @param {Function} [options.openRegexTester] The function to call when the extension view requests
 * that the regex tester should open. The function may be passed an existing regular expression
 * string and should return a promise to be resolved with an updated regular expression string.
 * @param {Function} [options.openDataElementSelector] The function to call when the extension view
 * requests that the data element selector should open. The function should return a promise that
 * is resolved with the selected data element name.
 * @param {Function} [options.openCssSelector] The function to call when the extension view requests
 * that the CSS selector should open. The function should return a promise that is resolved
 * with the generated CSS selector.
 * @returns {Bridge}
 */
export const loadIframe = options => {
  const {
    url,
    extensionInitOptions = {},
    container = document.body,
    editModeBoundsContainer = document.documentElement,
    editModeZIndex = 1000,
    editModeEntered = noop,
    editModeExited = noop,
    connectionTimeoutDuration = CONNECTION_TIMEOUT_DURATION,
    renderTimeoutDuration = RENDER_TIMEOUT_DURATION,
    openCodeEditor = noop,
    openRegexTester = noop,
    openDataElementSelector = noop,
    openCssSelector = noop
  } = options;

  let penpalConnection;

  const frameboyant = new Frameboyant({
    editModeZIndex,
    editModeBoundsContainer
  });
  container.appendChild(frameboyant.root);

  let resolveIframeHeightSet;
  const iframeHeightSet = new Promise(resolve => resolveIframeHeightSet = resolve);
  iframeHeightSet.then(() => logger.log('Resize complete'));

  let resolveInitComplete;
  const initComplete = new Promise(resolve => resolveInitComplete = resolve);
  initComplete.then(() => logger.log('Init complete.'));

  const sharedViewOpenedHandler = () => {
    frameboyant.setExitEditModeOnFocus(false);
  };

  const sharedViewClosedHandler = () => {
    frameboyant.setExitEditModeOnFocus(true);
  };

  const createOpenSharedViewProxy = openSharedViewFn => {
    return (...args) => {
      const promise = Promise.resolve(openSharedViewFn(...args));
      sharedViewOpenedHandler();
      promise.then(sharedViewClosedHandler, sharedViewClosedHandler);
      return promise;
    }
  };

  const destroy = () => {
    penpalConnection.destroy();
    frameboyant.destroy();
  };

  const loadPromise = new Promise((resolve, reject) => {
    const connectionTimeoutId = setTimeout(() => {
      destroy();
      reject(ERROR_CODES.CONNECTION_TIMEOUT);
    }, connectionTimeoutDuration);

    penpalConnection = Penpal.connectToChild({
      url,
      appendTo: frameboyant.iframeContainer,
      methods: {
        openCodeEditor: createOpenSharedViewProxy(openCodeEditor),
        openRegexTester: createOpenSharedViewProxy(openRegexTester),
        openDataElementSelector: createOpenSharedViewProxy(openDataElementSelector),
        openCssSelector: createOpenSharedViewProxy(openCssSelector),
        editModeEntered: () => {
          editModeEntered();
          return frameboyant.editModeEntered();
        },
        editModeExited: () => {
          editModeExited();
          frameboyant.editModeExited();
        },
        setIframeHeight(...args) {
          frameboyant.setIframeHeight(...args);
          resolveIframeHeightSet();
        }
      }
    });

    penpalConnection.promise.then(child => {
      clearTimeout(connectionTimeoutId);

      const renderTimeoutId = setTimeout(() => {
        destroy();
        reject(ERROR_CODES.RENDER_TIMEOUT);
      }, renderTimeoutDuration);

      frameboyant.setChild(child);
      child.init(extensionInitOptions).then(resolveInitComplete);

      Promise.all([
        iframeHeightSet,
        initComplete,
      ]).then(() => {
        clearTimeout(renderTimeoutId);
        resolve({
          init: child.init,
          validate: child.validate,
          getSettings: child.getSettings,
          enterEditMode: child.enterEditMode,
          exitEditMode: child.exitEditMode,
        });
      });
    });
  });

  penpalConnection.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
  frameboyant.setIframe(penpalConnection.iframe);

  return {
    promise: loadPromise,
    iframe: penpalConnection.iframe,
    rootNode: frameboyant.root,
    destroy
  };
};

export const setPromise = value => {
  Promise = value;
  Penpal.Promise = value;
};
export const setDebug = value => {
  Penpal.debug = value;
  Logger.enabled = value;
};
