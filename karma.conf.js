const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const ip = require('ip');
const argv = require('yargs').argv;
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').babel;
const packageDescriptor = require('./package.json');

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

let startConnect = false;
let reporters = ['dots'];
let buildId;
let defaultBrowsers = ['Chrome', 'Firefox'];

if (process.env.CI) {
  buildId =
    'CI #' +
    process.env.GITHUB_RUN_NUMBER +
    ' (' +
    process.env.GITHUB_RUN_ID +
    ')';

  defaultBrowsers = [
    'SL_EDGE',
    'SL_CHROME',
    'SL_FIREFOX',
    'SL_ANDROID',
    'SL_SAFARI'
  ];
  reporters.push('saucelabs');
} else {
  startConnect = true;
}

if (process.env.SAUCE_USERNAME) {
  reporters.push('saucelabs');
}

const customLaunchers = {
  SL_CHROME: {
    base: 'SauceLabs',
      browserName: 'chrome',
      browserVersion: 'latest',
      platformName: 'Windows 10'
  },
  SL_FIREFOX: {
    base: 'SauceLabs',
      browserName: 'firefox',
      browserVersion: 'latest',
      platformName: 'Windows 10'
  },
  SL_SAFARI: {
    base: 'SauceLabs',
      browserName: 'safari',
      browserVersion: 'latest',
      platformName: 'macOS 10.15'
  },
  SL_IE10: {
    base: 'SauceLabs',
      browserName: 'internet explorer',
      platformName: 'Windows 7',
      browserVersion: '10'
  },
  SL_IE11: {
    base: 'SauceLabs',
      browserName: 'internet explorer',
      platformName: 'Windows 7',
      browserVersion: '11'
  },
  SL_EDGE: {
    base: 'SauceLabs',
      browserName: 'MicrosoftEdge',
      browserVersion: 'latest',
      platformName: 'Windows 10'
  },
  SL_IOS: {
    base: 'SauceLabs',
      deviceName: 'iPhone X Simulator',
      appiumVersion: '1.19.1',
      browserName: 'Safari',
      platformName: 'iOS',
      platformVersion: '14.0'
  },
  SL_ANDROID: {
    base: 'SauceLabs',
      deviceName: 'Android GoogleAPI Emulator',
      appiumVersion: '1.18.1',
      browserName: 'Chrome',
      platformName: 'Android',
      platformVersion: '11.0'
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
      // We use this proxy so that when extensionbridge.min.js loads
      // /extensionbridge/extensionbridge-child.js (which is the path Lens serves
      // extensionbridge-child.js from), the file will be found.
      '/extensionbridge/': '/base/dist/',
      // This proxy is needed for the url parameter bridgepath to work.
      '/source/nested-app/extensionbridge/': '/base/dist/'
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
    reporters: reporters,
    hostname: ip.address(),
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    port: 9801,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers: customLaunchers,
    browsers: defaultBrowsers,
    singleRun: true,
    sauceLabs: {
      buildId: buildId,
      testName: packageDescriptor.name + ' Test',
      tunnelIdentifier: 'github-action-tunnel',
      startConnect: startConnect,
      retryLimit: 3,
      idleTimeout: 360,
      recordVideo: false,
      recordScreenshots: false,
      // https://support.saucelabs.com/hc/en-us/articles/115010079868-Issues-with-Safari-and-Karma-Test-Runner
      connectOptions: {
        noSslBumpDomains: 'all'
      }
    },
    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 5,
  });
};
