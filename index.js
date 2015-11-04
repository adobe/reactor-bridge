var path = require('path');
var glob = require('glob');

module.exports = function(gulp) {
  // Require in each task.
  glob.sync(path.join(__dirname, 'tasks/*.js')).forEach(function(taskFile) {
    require(taskFile)(gulp);
  });
};
