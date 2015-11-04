'use strict';

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var path = require('path');
var browserify = require('browserify');
var eventStream = require('event-stream');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

module.exports = function(gulp) {
  gulp.task("build", function() {
    var paths = [
      require.resolve('lens-extension-bridge/src/extensionBridge.contentWindow.js'),
      require.resolve('jschannel')
    ];

    var srcStream = gulp.src(paths);
    var ajvStream =
      browserify('./src/ajv.js')
        .bundle()
        .pipe(source('ajv.bundle.js'))
        .pipe(buffer());

    return eventStream.merge(ajvStream, srcStream)
      .pipe(concat("bundle.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("dist/"));
  });
};
