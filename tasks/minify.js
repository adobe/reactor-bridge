'use strict';

var uglify = require('gulp-uglify');
var path = require('path');
var rename = require('gulp-rename');

module.exports = function(gulp) {
  gulp.task('extensionBridge:minify', ['extensionBridge:build'], function() {
    return gulp.src(path.join(__dirname, '../dist/js/iframe.js'))
      .pipe(uglify())
      .pipe(rename('iframe.min.js'))
      .pipe(gulp.dest(path.join(__dirname, '../dist/js')));
  });
};
