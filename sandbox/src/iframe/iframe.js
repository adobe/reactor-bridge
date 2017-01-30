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

window.extensionBridge.register({
  init: function() {},
  validate: function() {},
  getSettings: function() {}
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
  }, 50);
};

document.addEventListener('DOMContentLoaded', function() {
  animateSlide(document.getElementById('animatedBox'));

  document.querySelector('button').addEventListener('click', () => {
    window.extensionBridge.openCodeEditor();
  });
});

// setTimeout(function() {
//   document.getElementById('bigImage').setAttribute('src', 'http://static.pexels.com/photos/87646/horsehead-nebula-dark-nebula-constellation-orion-87646.jpeg');
// }, 200);
