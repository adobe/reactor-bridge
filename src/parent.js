/***************************************************************************************
 * (c) 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

import Penpal from 'penpal';
import Logger from './utils/logger';

const CONNECTION_TIMEOUT_DURATION = 10000;
const RENDER_TIMEOUT_DURATION = 2000;

const logger = new Logger('ExtensionBridge:Parent');
const noop = () => {};

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
    markAsDirty = noop
  } = options;

  let destroy;
  let iframe;

  const createOpenSharedViewProxy = openSharedViewFn => {
    return (...args) => {
      return Promise.resolve(openSharedViewFn(...args));
    }
  };

  const loadPromise = new Promise((resolve, reject) => {
    let renderTimeoutId;

    const penpalConnection = Penpal.connectToChild({
      url,
      appendTo: container,
      timeout: connectionTimeoutDuration,
      methods: {
        openCodeEditor: createOpenSharedViewProxy(openCodeEditor),
        openRegexTester: createOpenSharedViewProxy(openRegexTester),
        openDataElementSelector: createOpenSharedViewProxy(openDataElementSelector),
        extensionRegistered() {
          logger.log('Extension registered.');
          penpalConnection.promise.then(child => {
            child.init(extensionInitOptions).then(() => {
              clearTimeout(renderTimeoutId);
              logger.log('Extension initialized.');
              resolve({
                // We hand init back even though we just called init(). This is really for
                // the sandbox tool's benefit so a developer testing their extension view can
                // initialize multiple times with different info.
                init: child.init,
                validate: child.validate,
                getSettings: child.getSettings
              });
            }).catch(error => {
              clearTimeout(renderTimeoutId);
              reject(error);
            });
          });
        },
        markAsDirty
      }
    });

    penpalConnection.promise.then(() => {
      renderTimeoutId = setTimeout(() => {
        reject(ERROR_CODES.RENDER_TIMEOUT);
        destroy();
      }, renderTimeoutDuration);
    }, error => {
      if (error.code === Penpal.ERR_CONNECTION_TIMEOUT) {
        reject(ERROR_CODES.CONNECTION_TIMEOUT);
      } else {
        reject(error);
      }
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

export const setDebug = value => {
  Penpal.debug = value;
  Logger.enabled = value;
};
