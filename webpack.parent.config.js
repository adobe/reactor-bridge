'use strict';

module.exports = {
  entry: './src/parent.js',
  output: {
    path: './lib',
    filename: 'parent.js'
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
