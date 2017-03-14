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

import Penpal from 'penpal';
import Logger from './utils/logger';

const CONNECTION_TIMEOUT_DURATION = 10000;
const RENDER_TIMEOUT_DURATION = 2000;

const logger = new Logger('ExtensionBridge:Parent');
const noop = () => {};

let Promise = window.Promise;

export const ERROR_CODES = {
  CONNECTION_TIMEOUT: 'connectionTimeout',
  RENDER_TIMEOUT: 'renderTimeout',
  DESTROYED: 'destroyed'
};

/**
 * An object providing bridge-related API.
 * @typedef {Object} Bridge
 * @property {Promise} The promise will be resolved once (1) communication with the iframe has
 * been established, (2) the iframe has been resized to its content, and (3) the iframe has
 * acknowledged receiving the initial init() call. The promise will be resolved
 * with an {IframeAPI} object that will act as the API to use to communicate with the iframe.
 * @property {HTMLIframeElement} iframe The created iframe. You may use this to add classes to the
 * iframe, etc.
 * @property {Function} destroy Removes the iframe from its container and cleans up any supporting
 * utilities.
 */

/**
 * An API the consumer will use to call methods on the iframe.
 * @typedef {Object} IframeAPI
 * @property {Function} validate Validates the extension view.
 * @property {Function} getSettings Retrieves settings from the extension view.
 */

/**
 * Loads an extension iframe and connects all the necessary APIs.
 * @param {Object} options
 * @param {string} options.url The URL of the extension view to load.
 * @param {Object} [options.extensionInitOptions={}] The options to be passed to the initial init()
 * call on the extension view.
 * @param {HTMLElement} [options.container=document.body] The container DOM element to which the
 * extension iframe should be added.
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
    connectionTimeoutDuration = CONNECTION_TIMEOUT_DURATION,
    renderTimeoutDuration = RENDER_TIMEOUT_DURATION,
    openCodeEditor = noop,
    openRegexTester = noop,
    openDataElementSelector = noop,
    openCssSelector = noop
  } = options;

  let destroy;
  let iframe;


  const createOpenSharedViewProxy = openSharedViewFn => {
    return (...args) => {
      const promise = Promise.resolve(openSharedViewFn(...args));
      return promise;
    }
  };

  const loadPromise = new Promise((resolve, reject) => {
    const connectionTimeoutId = setTimeout(() => {
      reject(ERROR_CODES.CONNECTION_TIMEOUT);
      destroy();
    }, connectionTimeoutDuration);

    const childConfig = {
      url,
      appendTo: container,
      methods: {
        openCodeEditor: createOpenSharedViewProxy(openCodeEditor),
        openRegexTester: createOpenSharedViewProxy(openRegexTester),
        openDataElementSelector: createOpenSharedViewProxy(openDataElementSelector),
        openCssSelector: createOpenSharedViewProxy(openCssSelector)
      }
    };
    const penpalConnection = Penpal.connectToChild(childConfig);

    penpalConnection.promise.then(child => {
      clearTimeout(connectionTimeoutId);

      const renderTimeoutId = setTimeout(() => {
        reject(ERROR_CODES.RENDER_TIMEOUT);
        destroy();
      }, renderTimeoutDuration);

      child.init(extensionInitOptions).then(() => {
        logger.log('Init complete.')
        clearTimeout(renderTimeoutId);
        resolve({
          init: child.init,
          validate: child.validate,
          getSettings: child.getSettings
        });
      })
      .catch(error => {
        clearTimeout(renderTimeoutId);
        reject(`Initialization failed: ${error}`);
      });
    }, error => {
      reject(`Connection failed: ${error}`);
    });

    destroy = () => {
      reject(ERROR_CODES.DESTROYED);
      penpalConnection.destroy();
    };

    iframe = penpalConnection.iframe;
  });

  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');

  return {
    promise: loadPromise,
    iframe,
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
