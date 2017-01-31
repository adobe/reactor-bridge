/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2016 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property
* laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

'use strict';

const webpack = require('webpack');
const UglifyJS = require('uglify-js');
const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const once = require('once');
const createWebpackOutputHandler = require('./createWebpackOutputHandler');

const childLoaderInputPath = path.resolve(__dirname, '../../src/childLoader.js');
const childLoaderOutputPath = path.resolve(__dirname, '../../dist/extensionbridge.min.js');
const childInputPath = path.resolve(__dirname, '../../src/child.js');
const childOutputPath = path.resolve(__dirname, '../../dist/extensionbridge-child.js');
const banner = fs.readFileSync('./copyrightBanner.txt', 'utf8');

const noop = () => {};

const buildChildLoader = (successCallback = noop, errorCallback = noop) => {
  const result = UglifyJS.minify(childLoaderInputPath, {
    compress: true,
    mangle: true
  });

  fs.outputFile(childLoaderOutputPath, result.code, err => {
    if (err) {
      console.error(err);
      errorCallback(err);
    } else {
      const shortPath = path.relative(process.cwd(), childLoaderOutputPath);
      console.log(`${shortPath} created`);
      successCallback();
    }
  });
};

var childCompiler = webpack({
  entry: childInputPath,
  output: {
    path: path.dirname(childOutputPath),
    filename: path.basename(childOutputPath)
  },
  module: {
    loaders: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-object-rest-spread']
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.BannerPlugin(banner, {
      raw: true
    })
  ]
});

/**
 * Builds the Child portion of extension bridge.
 * @param [options]
 * @param [options.watch=false] Whether files should be watched for changes. When changes are
 * detected, Child will be rebuilt.
 * @returns {Promise} A promise which will be resolved after the initial build.
 */
module.exports = (options = {}) => {
  const buildChildLoaderPromise = new Promise((resolve, reject) => {
    buildChildLoader(resolve, reject);

    if (options.watch) {
      const watcher = chokidar.watch(childLoaderInputPath);
      watcher.on('change', () => {
        buildChildLoader();
      });
    }
  });

  const buildChildPromise = new Promise((resolve, reject) => {
    const webpackOutputHandler = createWebpackOutputHandler(resolve, reject);

    if (options.watch) {
      childCompiler.watch({}, webpackOutputHandler);
    } else {
      childCompiler.run(webpackOutputHandler);
    }
  });

  return Promise.all([
    buildChildLoaderPromise,
    buildChildPromise
  ]);
};
