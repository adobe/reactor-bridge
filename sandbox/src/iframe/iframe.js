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
