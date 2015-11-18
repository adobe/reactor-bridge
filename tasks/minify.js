'use strict';

var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var path = require('path');
var rename = require('gulp-rename')

module.exports = function(gulp) {
  gulp.task('windgoggles:minifyJS', ['windgoggles:buildIframeJS'], function () {
    return gulp.src(path.join(__dirname, '../dist/js/iframe.js'))
      .pipe(uglify())
      .pipe(rename('iframe.min.js'))
      .pipe(gulp.dest(path.join(__dirname, '../dist/js')));
  });

  gulp.task('windgoggles:minifyCSS', ['windgoggles:buildIframeCSS'], function () {
    return gulp.src(path.join(__dirname, '../dist/css/iframe.css'))
      .pipe(minifyCSS())
      .pipe(rename('iframe.min.css'))
      .pipe(gulp.dest(path.join(__dirname, '../dist/css')));
  });

  gulp.task('windgoggles:minify', ['windgoggles:minifyJS', 'windgoggles:minifyCSS']);
};
