'use strict';

var concat = require('gulp-concat');
var path = require('path');
var webpack = require('webpack-stream');
var eventStream = require('event-stream');

module.exports = function(gulp) {
  gulp.task("windgoggles:buildIframeJS", function() {
    var paths = [
      require.resolve('iframe-resizer/js/iframeResizer.contentWindow'),
      require.resolve('coralui/build/js/libs/jquery'),
      require.resolve('coralui/build/js/libs/moment'),
      require.resolve('coralui/build/js/coral')
    ];

    var sourceStream = gulp.src(paths);

    var frameboyantStream = gulp
      .src(require.resolve('../src/frameboyant.contentWindow.js'))
      .pipe(webpack());

    var extensionBridgeStream = gulp
      .src(path.join(__dirname, '../src/extensionBridge.contentWindow.js'))
      .pipe(webpack({
        module: {
          loaders: [{ test: /\.json$/, loader: "json" }]
        }
      }));

    return eventStream.merge(sourceStream, frameboyantStream, extensionBridgeStream)
      .pipe(concat("iframe.js"))
      .pipe(gulp.dest(path.join(__dirname, '../dist/js')));
  });

  gulp.task("windgoggles:buildIframeCSS", function() {
    var coralUiPath = path.dirname(require.resolve('coralui/build/js/coral'));
    var paths = [
      path.join(coralUiPath, '..', 'css', 'coral.css')
    ];

    var srcStream = gulp.src(paths);

    return srcStream
      .pipe(concat("iframe.css"))
      .pipe(gulp.dest(path.join(__dirname, '../dist/css')));
  });

  gulp.task("windgoggles:copyResources", function() {
    var coralUiPath = path.dirname(require.resolve('coralui/build/js/coral'));
    return gulp.src([path.join(coralUiPath, '..', 'resources', '**/*')])
      .pipe(gulp.dest(path.join(__dirname, '../dist/resources')));
  });

  gulp.task('windgoggles:buildIframe', [
    'windgoggles:buildIframeCSS',
    'windgoggles:buildIframeJS',
    'windgoggles:copyResources'
  ]);
};
