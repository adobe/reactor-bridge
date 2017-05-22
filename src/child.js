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
    // TODO: Remove the "if" after the deprecation process is complete.
    if (typeof args[0] !== 'function') {
      console.warn(
        `Your usage of ${methodName} has been deprecated and support will be removed before ` +
        `Launch is released. Please refer to ` +
        `https://git.corp.adobe.com/reactor/propaganda/blob/master/guides/extensions/views.md#leveraging-shared-views ` +
        `for current method signature documentation.`
      );

      const callback = args.pop();

      if (!callback) {
        throw new Error('A callback is required when opening a shared view.');
      }

      switch (methodName) {
        case 'openCodeEditor':
          parent.openCodeEditor({ code: args[0] }).then(callback);
          break;
        case 'openRegexTester':
          parent.openRegexTester({ pattern: args[0] }).then(callback);
          break;
      }
    } else {
      const callback = args.shift();

      if (!callback) {
        throw new Error('A callback is required when opening a shared view.');
      }

      parent[methodName](...args).then(callback);
    }
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
