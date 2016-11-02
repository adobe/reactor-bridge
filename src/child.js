import PenPal from 'penpal';
import createFrameboyant from '@reactor/frameboyant/frameboyant.contentWindow';
import Promise from 'native-promise-only-ponyfill';
import iframeResizer from 'iframe-resizer/js/iframeResizer.contentWindow';

PenPal.Promise = Promise;

const frameboyant = createFrameboyant();

let debug = false;
let extensionViewMethods = {};
let parent = {};

const log = message => {
  if (debug) {
    console.log(`[ExtensionBridge] Child: ${message}`);
  }
};

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
    getSettings: wrapExtensionViewMethod('getSettings')
  }
}).then(_parent => parent = _parent);

frameboyant.stylesAppliedCallback = () => {
  // Tell the iframe resizer that it needs to resize the iframe since it won't
  // automatically detect that the styles have been updated via frameboyant.
  if ('parentIFrame' in window) {
    window.parentIFrame.size();
  }

  log('Styles applied.');
};

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

    log('Extension view methods registered.');
  },
  setDebug: function(value) {
    PenPal.debug = value;
    debug = value;
  }
};

module.exports.setDebug(true);

