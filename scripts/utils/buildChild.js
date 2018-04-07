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

const fs = require('fs-extra');
const path = require('path');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');
const babel = require('rollup-plugin-babel');

const childLoaderInputPath = path.resolve(__dirname, '../../src/childLoader.js');
const childInputPath = path.resolve(__dirname, '../../src/child.js');
const banner = fs.readFileSync('./copyrightBanner.txt', 'utf8');


const plugins = [
  commonjs(),
  resolve(),
  babel(),
  uglify({
    output: {
      preamble: banner
    }
  })
];

const childLoaderInputOptions = {
  input: childLoaderInputPath,
  plugins
};

const childLoaderOutputOptions = {
  file: './dist/extensionbridge.min.js',
  format: 'iife'
};

const childInputOptions = {
  input: childInputPath,
  plugins
};

const childOutputOptions = {
  file: './dist/extensionbridge-child.js',
  format: 'iife'
};

/**
 * Builds the Child portion of extension bridge.
 * @param [options]
 * @param [options.watch=false] Whether files should be watched for changes. When changes are
 * detected, Child will be rebuilt.
 * @returns {Promise} A promise which will be resolved after the initial build.
 */
module.exports = (options = {}) => {
  if (options.watch) {
    return new Promise((resolve) => {
      rollup.watch([
        {
          ...childLoaderInputOptions,
          output: childLoaderOutputOptions
        },
        {
          ...childInputOptions,
          output: childOutputOptions
        },
      ]).on('event', (event) => {
        if (event.code === 'END') {
          resolve();
        }
      });
    })
  } else {
    return Promise.all([
      rollup.rollup(childLoaderInputOptions).then((bundle) => {
        return bundle.write(childLoaderOutputOptions);
      }),
      rollup.rollup(childInputOptions).then((bundle) => {
        return bundle.write(childOutputOptions);
      })
    ]);
  }
};
