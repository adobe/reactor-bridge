'use strict';

var gulp = require('gulp');
var path = require('path');
var glob = require('glob');

glob.sync(path.join(__dirname, 'tasks/*.js')).forEach(function(taskFile) {
  require(taskFile)(gulp);
});
