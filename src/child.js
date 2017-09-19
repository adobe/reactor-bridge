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
import Promise from 'promise-polyfill';
import Logger from './utils/logger';
import addStylesToPage from './utils/addStylesToPage';

const STYLES = `
  html, body {
    background-color: transparent !important;
  }
`;

addStylesToPage(STYLES);

Penpal.Promise = Promise;

const logger = new Logger('ExtensionBridge:Child');
let extensionViewMethods = {};
let parent = {};

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
  if (parent[methodName]) {
    const callback = args.shift();

    if (!callback) {
      throw new Error('A callback is required when opening a shared view.');
    }

    parent[methodName](...args).then(callback);
  } else {
    throw new Error(`An error occurred while opening ${sharedViewName}. The shared view is unavailable.`);
  }
};

Penpal.connectToParent({
  methods: {
    init,
    validate,
    getSettings
  }
}).promise.then(_parent => {
  parent = _parent;

  // When the iframe gains focus we consider its contents "dirty". This is used by Lens
  // to determine whether to show a warning to a user when they attempt to leave the editor.
  window.addEventListener('focus', () => {
    parent.markAsDirty();
  });
});

const extensionBridge = {
  openCodeEditor: wrapOpenSharedViewMethod('openCodeEditor', 'code editor'),
  openDataElementSelector: wrapOpenSharedViewMethod('openDataElementSelector', 'data element selector'),
  openCssSelector: wrapOpenSharedViewMethod('openCssSelector', 'CSS selector'),
  openRegexTester: wrapOpenSharedViewMethod('openRegexTester', 'regex tester'),
  register(methods) {
    extensionViewMethods = {
      ...methods
    };

    logger.log('Methods registered by extension.');
  },
  setDebug(value) {
    Penpal.debug = value;
    Logger.enabled = value;
  }
};

const executeQueuedCall = (call) => {
  extensionBridge[call.methodName].apply(null, call.args);
};

const callQueue = window.extensionBridge._callQueue;

while (callQueue.length) {
  executeQueuedCall(callQueue.shift());
}

callQueue.push = executeQueuedCall;
