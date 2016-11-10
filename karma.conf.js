const webpack = require('webpack');
const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');

/**
 * We're going to server fixtures (our mock extension views) from a port that's different from
 * the tests running on Karma. This is so we can test that cross-domain communication is
 * functioning as expected. This is important because in production extension views will be
 * served from a different domain than Lens.
 */
const serveFixtures = () => {
  webpack(require('./webpack.child.config')).watch({}, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      console.log(stats.toString({
        chunks: false
      }));
    }
  });

  const childIframes = connect()
    .use(serveStatic('dist'))
    .use(serveStatic('src/__tests__/fixtures'));

  http.createServer(childIframes).listen(9800);
};

module.exports = function(config) {
  serveFixtures();

  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/__tests__/*.test.js', watched: false },
      // Re-run tests when fixtures change.
      { pattern: 'src/__tests__/fixtures/*', watched: true, included: false, served: false },
      // Re-run tests when dist files change (the fixtures use these).
      { pattern: 'dist/*', watched: true, included: false, served: false }
    ],
    preprocessors: {
      'src/__tests__/*.test.js': ['webpack']
    },
    webpack: {
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
    },
    reporters: ['dots'],
    port: 9801,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity
  });
};
