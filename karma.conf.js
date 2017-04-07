const webpack = require('webpack');
const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const ip = require('ip');
const path = require('path');
const argv = require('yargs').argv;

/**
 * We're going to serve fixtures (our mock extension views) from a port that's different from
 * the tests running on Karma. This is so we can test that cross-domain communication is
 * functioning as expected. This is important because in production extension views will be
 * served from a different domain than Lens.
 */
const serveFixtures = () => {
  const childIframes = connect()
    .use(serveStatic(path.join(require.resolve('promise-polyfill'), '..')))
    .use(serveStatic('dist'))
    .use(serveStatic('src/__tests__/fixtures'));

  http.createServer(childIframes).listen(9800);
};

const webdriverConfig = {
  hostname: '10.51.16.127',
  port: 4444
};

const customLaunchers = {
  'IE11 - Selenium Grid': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'internet explorer',
    version: 11
  },
  'Edge - Selenium Grid': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'MicrosoftEdge'
  },
  'Chrome - Selenium Grid': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'chrome'
  },
  'Firefox - Selenium Grid': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'firefox'
  }
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
      { pattern: 'dist/*', watched: true, included: false, served: true },
    ],
    proxies: {
      '/extensionbridge/': '/base/dist/'
    },
    preprocessors: {
      'src/__tests__/*.test.js': ['webpack']
    },
    webpack: {
      module: {
        loaders: [
          {
            test: /.js$/,
            exclude: /node_modules/,
            loader: 'babel'
          }
        ]
      }
    },
    reporters: ['dots'],
    hostname: ip.address(),
    port: 9801,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers,
    browsers: argv.ci ? Object.keys(customLaunchers) : ['Chrome', 'Firefox'],
    singleRun: true,
    concurrency: Infinity
  });
};
