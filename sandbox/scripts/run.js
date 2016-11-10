#!/usr/bin/env node

const webpack = require('webpack');
const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const path = require('path');
const async = require('async');
const once = require('once');
const sandboxWebpackConfig = require('../webpack.sandbox.config');
const extensionBridgeChildWebpackConfig = require('../../webpack.child.config');

const IFRAME_PORT = 9800;
const SANDBOX_PORT = 9801;

const createWebpackOutputHandler = callback => {
  return (err, stats) => {
    console.log(err || stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true
    }));
    callback();
  };
};

async.parallel(
  [
    callback => {
      webpack(sandboxWebpackConfig).watch({}, createWebpackOutputHandler(once(callback)));
    },
    callback => {
      webpack(extensionBridgeChildWebpackConfig).watch({}, createWebpackOutputHandler(once(callback)));
    },
    callback => {
      const handleRequest = connect()
        .use(serveStatic(path.join(__dirname, '../../dist'))) // Serve extensionbridge.js
        .use(serveStatic(path.join(__dirname, '../src/iframe'))); // Serve iframe html files.

      http.createServer(handleRequest).listen(IFRAME_PORT, callback);
    },
    callback => {
      const handleRequest = connect()
        .use(serveStatic(path.join(__dirname, '../dist'))) // Serve built sandbox index.js.
        .use(serveStatic(path.join(__dirname, '../src'))); // Serve sandbox html + other resources.

      http.createServer(handleRequest).listen(SANDBOX_PORT, callback);
    }
  ],
  () => {
    console.log(`Sandbox server started on port ${SANDBOX_PORT} (iframes being served from port ${IFRAME_PORT})`);
  }
);


