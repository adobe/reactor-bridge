#!/usr/bin/env node

/***************************************************************************************
 * (c) 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const path = require('path');
const buildChild = require('./utils/buildChild');

const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');

const IFRAME_PORT = 9800;
const SANDBOX_PORT = 9801;

const rollupConfig = {
  input: path.join(__dirname, '../sandbox/src/index.js'),
  plugins: [
    commonjs(),
    resolve(),
    babel()
  ],
  output: {
    file: path.join(__dirname, '../sandbox/dist/index.js'),
    format: 'iife'
  }
};

const buildSandboxParentApp = () => {
  return new Promise((resolve) => {
    rollup.watch(rollupConfig).on('event', (event) => {
      if (event.code === 'END') {
        resolve();
      }
    });
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
      .use('/extensionbridge/extensionbridge-child.js', (req, res) => {
        // Lens will host extensionbridge-child.js inside an extensionbridge directory. Because of
        // this, extensionbridge.min.js will load extensionbridge-child.js using the
        // path /extensionbridge/extensionbridge-child.js, so we mimic Lens paths
        // accordingly by providing this alias.
        res.writeHead(302, {
          Location: '/extensionbridge-child.js'
        });
        res.end();
      })
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

