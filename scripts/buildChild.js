#!/usr/bin/env node

const buildChild = require('./utils/buildChild');
const argv = require('yargs').argv;

buildChild({
  watch: argv.watch
}).catch(err => {
  console.error(err);
});
