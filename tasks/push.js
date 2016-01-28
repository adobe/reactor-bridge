'use strict';
var path = require('path');
var fs = require('fs');
var GulpSSH = require('gulp-ssh');
var through = require('through2');
var os = require('os');

module.exports = function(gulp) {
  gulp.task('windgoggles:push', ['windgoggles:minify'], function (callback) {
    var packageData = require(path.join(__dirname, '../package.json'));
    var version = packageData.version;

    var config = {
      host: 'adobetag.upload.akamai.com',
      port: 22,
      username: 'sshacs',
      privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh/dtm.akamai.prod')),
      basePath: '/126057/activation/reactor/iframe/'
    };

    var gulpSSH = new GulpSSH({
      ignoreErrors: false,
      sshConfig: config
    });

    function checkVersionExists(callback) {
      gulpSSH
        .exec(['ls -a ../activation/reactor/iframe/' + version])
        .pipe(through.obj(function (chunk, enc, cb) {
          callback(!(/No such file or directory/.test(String(chunk.contents))));
          cb();
        }));
    }

    checkVersionExists(function(versionFound) {
      if (versionFound) {
        console.error('Version `' + version + '` is already present on CDN.');
        callback();
      } else {
        gulp
          .src(path.join(__dirname, '../dist/**'))
          .pipe(gulpSSH.dest(path.join(config.basePath, version)))
          .on('finish', callback);
      }
    });
  });
};
