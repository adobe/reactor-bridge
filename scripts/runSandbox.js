#!/usr/bin/env node

const webpack = require('webpack');
const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const path = require('path');
const once = require('once');
const redirects = require('redirects');
const createWebpackOutputHandler = require('./utils/createWebpackOutputHandler');
const sandboxWebpackConfig = require('../sandbox/webpack.sandbox.config');
const buildChild = require('./utils/buildChild');

const IFRAME_PORT = 9800;
const SANDBOX_PORT = 9801;

const buildSandboxParentApp = () => {
  return new Promise((resolve, reject) => {
    webpack(sandboxWebpackConfig).watch({}, createWebpackOutputHandler(resolve, reject));
  });
};

const serveSandboxChildFiles = () => {
  return new Promise((resolve) => {
    const handleRequest = connect()
      // Serve extensionbridge.js
      .use(serveStatic(path.join(__dirname, '../dist')))
      // Serve iframe html + other resources.
      .use(serveStatic(path.join(__dirname, '../sandbox/src/iframe')));

    http.createServer(handleRequest).listen(IFRAME_PORT, resolve);
  });
};

const serveSandboxParentFiles = () => {
  new Promise((resolve) => {
    const handleRequest = connect()
      .use(redirects({
        // Lens will host extensionbridge-child.js inside an extensionbridge directory. Because of
        // this, extensionbridge.js will load extensionbridge-child.js using the
        // path /extensionbridge/extensionbridge-child.js so we mimic Lens paths
        // accordingly by providing this alias.
        '/extensionbridge/:file': '/:file'
      }))
      // Serve extensionbridge-child.js
      .use(serveStatic(path.join(__dirname, '../sandbox/dist')))
      // Serve sandbox html + other resources.
      .use(serveStatic(path.join(__dirname, '../sandbox/src')))
      // Serve built sandbox index.js.
      .use(serveStatic(path.join(__dirname, '../dist')));

    http.createServer(handleRequest).listen(SANDBOX_PORT, resolve);
  });
};

Promise.all([
  buildChild({ watch: true }),
  buildSandboxParentApp(),
  serveSandboxParentFiles(),
  serveSandboxChildFiles()
]).then(() => {
  console.log(`Sandbox server started on port ${SANDBOX_PORT} (iframes being served from port ${IFRAME_PORT})`);
}).catch(err => {
  console.error(err);
});

