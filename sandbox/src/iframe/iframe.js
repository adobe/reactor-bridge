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
