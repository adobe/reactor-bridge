import PenPal from 'penpal';
import Promise from 'native-promise-only-ponyfill';
import Logger from './utils/logger';
import Frameboyant from './frameboyant/frameboyant.child';

PenPal.Promise = Promise;

const logger = new Logger('ExtensionBridge:Child');
let extensionViewMethods = {};
let parent = {};

const wrapExtensionViewMethod = methodName => (...args) => {
  if (extensionViewMethods[methodName]) {
    let result;

    try {
      result = extensionViewMethods[methodName](...args);
    } catch (error) {
      console.error(`Error calling ${methodName} from parent window.`, error.stack);
    }

    return result;
  } else {
    console.error(`You must register a ${methodName} function using extensionBridge.register().`);
  }
};

const wrapOpenSharedViewMethod = (methodName, sharedViewName) => (...args) => {
  const callback = args.pop();

  if (parent[methodName]) {
    parent[methodName](...args).then(callback);
  } else {
    console.error(`An error occurred while opening ${sharedViewName}.`);
  }
};

PenPal.connectToParent({
  methods: {
    init: wrapExtensionViewMethod('init'),
    validate: wrapExtensionViewMethod('validate'),
    getSettings: wrapExtensionViewMethod('getSettings'),
    setContentRect: Frameboyant.setContentRect,
    exitEditMode: Frameboyant.exitEditMode
  }
}).then(_parent => {
  parent = _parent;
  Frameboyant.setParent(parent);
});

// document.addEventListener("DOMContentLoaded", () => parent.domReady());

// We can't do "export default" here because webpack would set window.extensionBridge.default
// instead of window.extensionBridge.
// https://github.com/webpack/webpack/issues/706
module.exports = {
  openCodeEditor: wrapOpenSharedViewMethod('openCodeEditor', 'code editor'),
  openDataElementSelector: wrapOpenSharedViewMethod('openDataElementSelector', 'data element selector'),
  openCssSelector: wrapOpenSharedViewMethod('openCssSelector', 'CSS selector'),
  openRegexTester: wrapOpenSharedViewMethod('openRegexTester', 'regex tester'),
  register: function(methods) {
    extensionViewMethods = {
      ...methods
    };

    logger.log('Methods registered by extension.');
  },
  setDebug: function(value) {
    PenPal.debug = value;
    Logger.enabled = value;
  }
};

// module.exports.setDebug(true);

