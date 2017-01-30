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

import { loadIframe, setDebug } from '../../src/parent';

setDebug(true);

const noop = () => {};

loadIframe({
  url: '//localhost:9800/iframe.html',
  container: document.getElementById('iframeHolder'),
  extensionInitOptions: {},
  openCodeEditor: noop,
  openRegexTester: noop,
  openDataElementSelector: noop,
  openCssSelector: noop,
  editModeZIndex: 1001,
  editModeEntered() {
    document.getElementById('backdrop').classList.add('editMode');
  },
  editModeExited() {
    document.getElementById('backdrop').classList.remove('editMode');
  }
}).promise.then(() => {
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
