import PenPal from 'penpal';
// import { iframeResizer } from 'iframe-resizer';
import Logger from './utils/logger';

const CONNECTION_TIMEOUT_DURATION = 10000;
const RENDER_TIMEOUT_DURATION = 2000;

const logger = new Logger('ExtensionBridge:Parent');

let Promise = window.Promise;

export const ERROR_CODES = {
  CONNECTION_TIMEOUT: 'connectionTimeout',
  RENDER_TIMEOUT: 'renderTimeout'
};

/**
 * An API the consumer will use to call methods on the iframe.
 * @typedef {Object} IframeAPI
 * @property {HTMLIframeElement} iframe The created iframe. You may use this to add classes to the
 * iframe, etc.
 * @property {Function} init Initializes the extension view.
 * @property {Function} validate Validates the extension view.
 * @property {Function} getSettings Retrieves settings from the extension view.
 * @property {Function} destroy Removes the iframe from its container and cleans up any supporting
 * utilities.
 */

/**
 * Loads an extension iframe and connects all the necessary APIs.
 * @param {Object} options
 * @param {string} options.url The URL of the extension view to load.
 * @param {HTMLElement} container The container DOM element to which the extension iframe should
 * be added.
 * @param {Object} options.extensionInitOptions The options to be passed to the initial init() call
 * on the extension view.
 * @param {Function} options.openCodeEditor The function to call when the extension view requests
 * that the code editor should open. The function may be passed existing code and should return
 * a promise to be resolved with updated code.
 * @param {Function} options.openRegexTester The function to call when the extension view requests
 * that the regex tester should open. The function may be passed an existing regular expression
 * string and should return a promise to be resolved with an updated regular expression string.
 * @param {Function} options.openDataElementSelector The function to call when the extension view
 * requests that the data element selector should open. The function should return a promise that
 * is resolved with the selected data element name.
 * @param {Function} options.openCssSelector The function to call when the extension view requests
 * that the CSS selector should open. The function should return a promise that is resolved
 * with the generated CSS selector.
 * @param {number} [options.connectionTimeoutDuration=10000] The amount of time, in milliseconds,
 * that must pass while attempting to establish communication with the iframe before rejecting
 * the returned promise with a CONNECTION_TIMEOUT error code.
 * @param {number} [options.renderTimeoutDuration=2000] The amount of time, in milliseconds,
 * that must pass while attempting to render the iframe before rejecting the returned promise
 * with a RENDER_TIMEOUT error code. This duration begins after communication with the iframe
 * has been established.
 * @returns {Promise} The promise will be resolved once (1) communication with the iframe has
 * been established, (2) the iframe's DOMContentLoaded event has occurred, (3) Frameboyant's styles
 * have been applied to the iframe, (4) the iframe resizer has made its initial resize, and
 * (5) the iframe has acknowledged receiving the initial init() call. The promise will be resolved
 * with an {IframeAPI} object that will act as the API to use to communicate with the iframe.
 */
export const loadIframe = options => new Promise((resolve, reject) => {
  const {
    url,
    container,
    extensionInitOptions,
    openCodeEditor,
    openRegexTester,
    openDataElementSelector,
    openCssSelector,
    activateEditMode,
    deactivateEditMode,
    setIframeHeight,
    connectionTimeoutDuration = CONNECTION_TIMEOUT_DURATION,
    renderTimeoutDuration = RENDER_TIMEOUT_DURATION
  } = options;

  // let resolveDomReadyPromise;
  // const domReadyPromise = new Promise(resolve => resolveDomReadyPromise = resolve);

  const connectionTimeoutId = setTimeout(() => {
    reject(ERROR_CODES.CONNECTION_TIMEOUT);
  }, connectionTimeoutDuration);

  let resolveIframeHeightSetPromise;
  const iframeHeightSetPromise = new Promise(resolve => resolveIframeHeightSetPromise = resolve);

  PenPal.connectToChild({
    url,
    appendTo: container,
    methods: {
      openCodeEditor,
      openRegexTester,
      openDataElementSelector,
      openCssSelector,
      // domReady: resolveDomReadyPromise,
      activateEditMode,
      deactivateEditMode,
      setIframeHeight(...args) {
        resolveIframeHeightSetPromise();
        setIframeHeight(...args);
      }
    }
  }).then(child => {
    clearTimeout(connectionTimeoutId);

    let resolveInitCompletePromise;
    const initCompletePromise = new Promise(resolve => resolveInitCompletePromise = resolve);

    initCompletePromise.then(() => logger.log('Init complete.'));

    const api = {
      iframe: child.iframe,
      init: child.init,
      validate: child.validate,
      getSettings: child.getSettings,
      setContentRect: child.setContentRect,
      destroy: () => {
        iframe.iFrameResizer.close();
        child.destroy();
      }
    };

    const renderTimeoutId = setTimeout(() => {
      reject(ERROR_CODES.RENDER_TIMEOUT);
    }, renderTimeoutDuration);

    Promise.all([
      iframeHeightSetPromise,
      initCompletePromise,
    ]).then(() => {
      clearTimeout(renderTimeoutId);
      resolve(api);
    });

    api.init(extensionInitOptions).then(resolveInitCompletePromise);
  });
});

export const setPromise = value => Promise = value;
export const setDebug = value => {
  PenPal.debug = value;
  Logger.enabled = value;
};

// setDebug(true);
