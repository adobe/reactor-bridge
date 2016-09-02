#!/usr/bin/env node

'use strict';

var webpack = require('webpack');

var entryPaths = [
  require.resolve('iframe-resizer/js/iframeResizer.contentWindow'),
  './src/contentWindow/extensionBridge.contentWindow.js'
];

webpack({
  entry: {
    'extensionbridge': entryPaths,
    'extensionbridge.min': entryPaths
  },
  output: {
    path: './dist',
    filename: '[name].js'
  },
  module: {
    loaders: [{ test: /\.json$/, loader: "json" }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      compress: {
        warnings: false
      }
    })
  ]
}).run(function(err, stats) {
  console.log(stats.toString('minimal'));
});
