'use strict';

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var browserify = require('browserify');
var eventStream = require('event-stream');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var path = require('path');

module.exports = function(gulp) {
  gulp.task("iframeutilsbuilder:buildJS", function() {
    var paths = [
      require.resolve('jschannel'),
      require.resolve('lens-extension-bridge/src/extensionBridge.contentWindow.js'),
      require.resolve('coralui/build/js/libs/jquery'),
      require.resolve('coralui/build/js/libs/moment'),
      require.resolve('coralui/build/js/coral')
    ];

    var srcStream = gulp.src(paths);
    var ajvStream =
      browserify('./src/ajv.js')
        .bundle()
        .pipe(source('ajv.bundle.js'))
        .pipe(buffer());

    return eventStream.merge(ajvStream, srcStream)
      .pipe(concat("iframeutils.bundle.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("dist/js/"));
  });

  gulp.task("iframeutilsbuilder:buildCSS", function() {
    var coralUiPath = path.dirname(require.resolve('coralui/build/js/coral'));
    var paths = [
      path.join(coralUiPath, '..', 'css', 'coral.min.css')
    ];

    var srcStream = gulp.src(paths);

    return srcStream
      .pipe(minifyCSS())
      .pipe(concat("iframeutils.bundle.min.css"))
      .pipe(gulp.dest("dist/css/"));
  });

  gulp.task("iframeutilsbuilder:copyResources", function() {
    var coralUiPath = path.dirname(require.resolve('coralui/build/js/coral'));
    return gulp.src([path.join(coralUiPath, '..', 'resources', '**/*')])
      .pipe(gulp.dest('dist/resources/'));
  });

  gulp.task('iframeutilsbuilder:build', [
    'iframeutilsbuilder:buildCSS',
    'iframeutilsbuilder:buildJS',
    'iframeutilsbuilder:copyResources'
  ]);
};
