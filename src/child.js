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
import addStylesToPage from './utils/addStylesToPage';

const STYLES = `
  html, body {
    background-color: transparent !important;
  }
`;

addStylesToPage(STYLES);

const logger = new Logger('ExtensionBridge:Child');
let extensionViewMethods = {};
let connectionPromise;

const getExtensionViewMethod = (methodName) => {
  const method = extensionViewMethods[methodName];
  if (method) {
    return method.bind(extensionViewMethods);
  } else {
    throw new Error(`Unable to call ${methodName} on the extension. The extension must register a ${methodName} function using extensionBridge.register().`);
  }
};

const init = (...args) => {
  getExtensionViewMethod('init')(...args);
};

const validate = (...args) => {
  const result = getExtensionViewMethod('validate')(...args);

  if (typeof result !== 'boolean') {
    throw new Error(`The extension attempted to return a non-boolean value from validate: ${result}`);
  }

  return result;
};

const getSettings = function(...args) {
  const result = getExtensionViewMethod('getSettings')(...args);

  if (typeof result !== 'object') {
    throw new Error('The extension attempted to return a non-object value from getSettings: ' + result);
  }

  return result;
};

const wrapOpenSharedViewMethod = (methodName, sharedViewName) => (...args) => {
  let callback;

  if (typeof args[0] === 'function') {
    callback = args.shift();
    // Deprecated April 10, 2018. 30+ extensions were using a callback at the time.
    console.warn(
      'Passing a callback to extensionBridge.' + methodName + '() has been deprecated. ' +
      'The method now returns a promise that should be used instead.'
    );
  }

  return connectionPromise.then((parent) => {
    if (parent[methodName]) {
      return parent[methodName](...args);
    } else {
      throw new Error(`An error occurred while opening ${sharedViewName}. The shared view is unavailable.`);
    }
  }).then((result) => {
    if (callback) {
      callback(result);
    }
    return result;
  });
};

connectionPromise = Penpal.connectToParent({
  methods: {
    init,
    validate,
    getSettings
  }
}).promise;

const extensionBridge = {
  openCodeEditor: wrapOpenSharedViewMethod('openCodeEditor', 'code editor'),
  openDataElementSelector: wrapOpenSharedViewMethod('openDataElementSelector', 'data element selector'),
  openRegexTester: wrapOpenSharedViewMethod('openRegexTester', 'regex tester'),
  register(methods) {
    extensionViewMethods = {
      ...methods
    };
    connectionPromise.then(parent => parent.extensionRegistered());
    logger.log('Methods registered by extension.');
  },
  setDebug(value) {
    Penpal.debug = value;
    Logger.enabled = value;
  }
};

window.addEventListener('focus', () => {
  connectionPromise.then(parent => parent.markAsDirty());
});

const executeQueuedCall = (call) => {
  // Not all of the extension bridge methods return promises. Rather than do a switch where we
  // only handle promises coming from certain methods here, we'll just always convert the return
  // value to a promise and them consistently.
  Promise.resolve(extensionBridge[call.methodName](...call.args))
    .then(call.resolve, call.reject);
};

const callQueue = window.extensionBridge._callQueue;

while (callQueue.length) {
  executeQueuedCall(callQueue.shift());
}

callQueue.push = executeQueuedCall;
