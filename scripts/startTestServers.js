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

'use strict';

const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const rollup = require('rollup');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').babel;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

async function buildParentIIFE() {
  const bundle = await rollup.rollup({
    input: path.join(ROOT, 'src/parent.js'),
    plugins: [
      commonjs({ transformMixedEsModules: true }),
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]
  });
  await bundle.write({
    file: path.join(ROOT, 'test-dist/parent.iife.js'),
    format: 'iife',
    name: 'ExtensionBridge'
  });
}

// Port 9800: child iframe origin — serves dist/ and fixture HTML files
const childApp = connect()
  .use(serveStatic(path.join(ROOT, 'dist')))
  .use(serveStatic(path.join(ROOT, 'src/__tests__/fixtures')));

// Port 9801: parent/test origin — replicates Karma's proxy rules so that
// extensionbridge.min.js can load extensionbridge-child.js from the right path
const parentApp = connect()
  .use('/extensionbridge', serveStatic(path.join(ROOT, 'dist')))
  .use('/source/nested-app/extensionbridge', serveStatic(path.join(ROOT, 'dist')))
  .use(serveStatic(path.join(ROOT, 'dist')))
  .use(serveStatic(path.join(ROOT, 'test-dist')))
  .use(serveStatic(path.join(ROOT, 'src/__tests__')));

const s1 = http.createServer(childApp);
const s2 = http.createServer(parentApp);

module.exports = async function globalSetup() {
  await buildParentIIFE();
  await Promise.all([
    new Promise(r => s1.listen(9800, r)),
    new Promise(r => s2.listen(9801, r))
  ]);
  return async function teardown() {
    await Promise.all([
      new Promise(r => s1.close(r)),
      new Promise(r => s2.close(r))
    ]);
  };
};
