import docOffset from 'document-offset';
import { loadIframe } from '../../src/parent';
import UIObserver from '../../src/utils/uiObserver';

const noop = () => {};

let child;
let editMode = false;

const uiObserver = new UIObserver(() => {
  child.setContentRect(getIframeContentRect());
});

const getIframeContentRect = () => {
  const contentRectBasis = editMode ? document.getElementById('iframePlaceholder') : child.iframe;
  const { top, left } = docOffset(contentRectBasis);
  const { width } = contentRectBasis.getBoundingClientRect();

  return {
    top,
    left,
    width,
  }
};

loadIframe({
  url: '//localhost:9800/iframe.html',
  container: document.getElementById('iframeContainer'),
  extensionInitOptions: {},
  openCodeEditor: noop,
  openRegexTester: noop,
  openDataElementSelector: noop,
  openCssSelector: noop,
  activateEditMode() {
    editMode = true;

    const iframeContentRect = getIframeContentRect();
    const ruleComponent = document.getElementById('ruleComponent');

    ruleComponent.classList.add('editMode');
    uiObserver.observe();

    return iframeContentRect;
  },
  deactivateEditMode() {
    editMode = false;
    uiObserver.disconnect();
    const ruleComponent = document.getElementById('ruleComponent');
    ruleComponent.classList.remove('editMode');
  },
  setIframeHeight(height) {
    const iframeContainer = document.getElementById('iframeContainer');
    iframeContainer.style.height = height + 'px';

    var iframePlaceholder = document.getElementById('iframePlaceholder');
    iframePlaceholder.style.height = height + 'px';
  }
}).then(_child => child = _child);

var animateSlide = function(element) {
  var height = 0;
  var mode = 'grow';

  setInterval(function() {
    if (height === 100) {
      mode = 'shrink';
    } else if (height === 0) {
      mode = 'grow';
    }

    mode === 'grow' ? height++ : height--;

    element.style.height = height + 'px';
  }, 20);
};

document.addEventListener('DOMContentLoaded', function() {
  animateSlide(document.getElementById('animatedBox'));
});
