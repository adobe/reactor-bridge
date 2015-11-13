var path = require('path');
var glob = require('globby');

module.exports = function(gulp) {
    // Require in each task.
  glob.sync([path.join(__dirname, '/*.js'), path.join('!', __dirname, '/index.js')])
    .forEach(function(taskFile) {
      require(taskFile)(gulp);
    });
};
