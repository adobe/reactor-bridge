'use strict';

var concat = require('gulp-concat');
var path = require('path');
var webpack = require('webpack-stream');
var eventStream = require('event-stream');

module.exports = function(gulp) {
  gulp.task('extensionBridge:buildIframe', function() {
    var paths = [
      require.resolve('iframe-resizer/js/iframeResizer.contentWindow')
    ];

    var sourceStream = gulp.src(paths);

    var contentWindowStream = gulp
      .src(path.join(__dirname, '../src/contentWindow/extensionBridge.contentWindow.js'))
      .pipe(webpack({
        module: {
          loaders: [{ test: /\.json$/, loader: "json" }]
        }
      }));

    return eventStream.merge(sourceStream, contentWindowStream)
      .pipe(concat("iframe.js"))
      .pipe(gulp.dest(path.join(__dirname, '../dist/js')));
  });
};
