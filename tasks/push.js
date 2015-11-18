'use strict';
var getUserHome = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

var path = require('path');
var fs = require('fs');
var GulpSSH = require('gulp-ssh');
var through = require('through2');

var versionFound;
var packageData = require(path.join(__dirname, '../package.json'));
var version = packageData.version;

var config = {
  host: 'adobetag.upload.akamai.com',
  port: 22,
  username: 'sshacs',
  privateKey: fs.readFileSync(path.join(getUserHome(), '.ssh/dtm.akamai.prod')),
  basePath: '/126057/activation/reactor/iframe/'
};

var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config
});

module.exports = function(gulp) {
  gulp.task('windgoggles:checkVersionExists', function () {
    return gulpSSH
      .exec(['ls -a ../activation/reactor/iframe/' + version])
      .pipe(through.obj(function (chunk, enc, callback) {
        versionFound = !(/No such file or directory/.test(String(chunk.contents)));
        callback()
      }));
  });

  gulp.task('windgoggles:iframePush', ['windgoggles:checkVersionExists', 'windgoggles:minify'], function () {
    if (versionFound) {
      console.error('Version `' + version + '` is already present on CDN.');
      return;
    }

    return gulp
      .src(path.join(__dirname, '../dist/**'))
      .pipe(gulpSSH.dest(path.join(config.basePath, version)));
  });

  gulp.task('windgoggles:push', ['windgoggles:iframePush']);
};
