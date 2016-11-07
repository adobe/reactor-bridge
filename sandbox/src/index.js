import { loadIframe } from '../../src/parent';

const noop = () => {};

loadIframe({
  url: '//localhost:9800/iframe.html',
  container: document.getElementById('ruleComponent'),
  extensionInitOptions: {},
  openCodeEditor: noop,
  openRegexTester: noop,
  openDataElementSelector: noop,
  openCssSelector: noop,
  editModeZIndex: 1001,
  activateEditMode() {
    document.getElementById('backdrop').classList.add('editMode');
  },
  deactivateEditMode() {
    document.getElementById('backdrop').classList.remove('editMode');
  }
}).then(() => {
  document.getElementById('ruleComponent').classList.remove('loading');
});

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
