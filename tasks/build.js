'use strict';

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var path = require('path');

module.exports = function(gulp) {
  gulp.task("iframeutilsbuilder:buildAJV", function() {

    console.log(path.join(__dirname, '../dist/js/'));
    return browserify(path.join(__dirname, '../src/ajv.js'))
      .bundle()
      .pipe(source('ajv.bundle.js'))
      .pipe(gulp.dest(path.join(__dirname, '../dist/js/')));
  });

  gulp.task("iframeutilsbuilder:buildJS", ['iframeutilsbuilder:buildAJV'], function() {
    var paths = [
      path.join(__dirname, '../dist/js/ajv.bundle.js'),
      require.resolve('jschannel'),
      require.resolve('lens-extension-bridge/src/extensionBridge.contentWindow.js'),
      require.resolve('coralui/build/js/libs/jquery'),
      require.resolve('coralui/build/js/libs/moment'),
      require.resolve('coralui/build/js/coral')
    ];

    return gulp.src(paths)
      .pipe(concat("iframeutils.bundle.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest(path.join(__dirname, '../dist/js')));
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
      .pipe(gulp.dest(path.join(__dirname, '../dist/css')));
  });

  gulp.task("iframeutilsbuilder:copyResources", function() {
    var coralUiPath = path.dirname(require.resolve('coralui/build/js/coral'));
    return gulp.src([path.join(coralUiPath, '..', 'resources', '**/*')])
      .pipe(gulp.dest(path.join(__dirname, '../dist/resources')));
  });

  gulp.task('iframeutilsbuilder:build', [
    'iframeutilsbuilder:buildCSS',
    'iframeutilsbuilder:buildJS',
    'iframeutilsbuilder:copyResources'
  ]);
};
