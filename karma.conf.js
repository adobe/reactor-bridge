const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const ip = require('ip');
const argv = require('yargs').argv;
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').babel;

/**
 * We're going to serve fixtures (our mock extension views) from a port that's different from
 * the tests running on Karma. This is so we can test that cross-domain communication is
 * functioning as expected. This is important because in production extension views will be
 * served from a different domain than Lens.
 */
const serveFixtures = () => {
  const childIframes = connect()
    .use(serveStatic('dist'))
    .use(serveStatic('src/__tests__/fixtures'));

  http.createServer(childIframes).listen(9800);
};

const webdriverConfig = {
  hostname: '10.51.16.127',
  port: 4444
};

const customLaunchers = {
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
    // We use this proxy so that when extensionbridge.min.js loads
    // /extensionbridge/extensionbridge-child.js (which is the path Lens serves
    // extensionbridge-child.js from), the file will be found.
    proxies: {
      '/extensionbridge/': '/base/dist/'
    },
    preprocessors: {
      'src/__tests__/*.test.js': ['rollup']
    },
    rollupPreprocessor: {
      plugins: [
        commonjs(),
        resolve(),
        babel({ babelHelpers: 'bundled' })
      ],
      output: {
        format: 'iife',
        name: 'bridge'
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
