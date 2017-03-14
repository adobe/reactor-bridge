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
import Promise from 'native-promise-only-ponyfill';
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
  const callback = args.pop();

  if (!callback) {
    throw new Error('A callback is required when opening a shared view.');
  }

  if (parent[methodName]) {
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
