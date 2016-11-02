'use strict';

module.exports = {
  entry: './src/child.js',
  output: {
    libraryTarget: 'var',
    library: 'extensionBridge',
    path: './dist',
    filename: 'extensionbridge.js'
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
  }
};
