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

import Promise from 'promise-polyfill';
import { loadIframe, setPromise, setDebug, ERROR_CODES } from '../parent';

describe('parent', () => {
  let bridge;

  beforeEach(() => {
    // So that the tests can successfully run in IE.
    setPromise(Promise);
    // Turn off debugging because individual test cases can set it to true.
    setDebug(false);
  });

  afterEach(() => {
    if (bridge) {
      bridge.destroy();
    }
  });

  it('loads an iframe and provides API', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`
    });

    expect(bridge.iframe).toEqual(jasmine.any(HTMLIFrameElement));
    expect(bridge.destroy).toEqual(jasmine.any(Function));

    bridge.promise.then(child => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.validate).toEqual(jasmine.any(Function));
      expect(child.getSettings).toEqual(jasmine.any(Function));
      done();
    });
  });

  it('loads an iframe into specified container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`,
      container
    });

    expect(container.querySelector('iframe')).toBe(bridge.iframe);
  });

  it('sets sandbox attribute on iframe', () => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`,
    });

    expect(bridge.iframe.getAttribute('sandbox'))
      .toBe('allow-same-origin allow-scripts allow-popups');
  });


  it('proxies extension view API', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/extensionViewApi.html`
    });

    bridge.promise.then(child => {
      Promise.all([
        child.init(),
        child.validate(),
        child.getSettings()
      ]).then(result => {
        expect(result).toEqual([
          undefined,
          false,
          {
            foo: 'bar'
          }
        ]);
        done();
      });
    });
  });

  it('returns a rejected promise if validate returns a non-boolean', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/invalidReturns.html`
    });

    bridge.promise.then(child => {
      child.validate().then(
        () => {},
        error => {
          expect(error)
            .toContain('The extension attempted to return a non-boolean value from validate');
          done();
        }
      );
    });
  });

  it('rejects load promise if extension view has not registered init function', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/unregisteredInit.html`
    });

    bridge.promise.then(
      () => {},
      error => {
        expect(error).toBe('Initialization failed: Error: Unable to call init on the extension. ' +
          'The extension must register a init function using extensionBridge.register().');
        done();
      }
    );
  });

  it('rejects load promise if extension view init function throws an error', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/initFailure.html`
    });

    bridge.promise.then(
      () => {},
      error => {
        expect(error).toBe('Initialization failed: Error: bad things');
        done();
      }
    );
  });

  it('returns a rejected promise if extension view has not registered ' +
      'getSettings (or validate) function', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/unregisteredGetSettings.html`
    });

    bridge.promise.then(child => {
      child.getSettings().then(
        () => {},
        error => {
          expect(error)
            .toContain('Unable to call getSettings on the extension. The extension must ' +
              'register a getSettings function using extensionBridge.register().');
          done();
        }
      );
    });
  });

  it('proxies lens API', done => {
    const addResultSuffix = code => code + ' result';

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/lensApi.html`,
      openCodeEditor: addResultSuffix,
      openRegexTester: addResultSuffix,
      openDataElementSelector: addResultSuffix,
      openCssSelector: addResultSuffix
    });

    bridge.promise.then(child => {
      // We abuse getSettings() for our testing purposes.
      child.getSettings().then(response => {
        expect(response.results).toEqual([
          'code editor result',
          'regex tester result',
          'data element selector result',
          'css selector result'
        ]);
        done();
      });
    });
  });

  it('rejects promise when connection fails', done => {
    jasmine.clock().install();

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/connectionFailure.html`
    });

    bridge.promise.then(child => {
      // Do nothing.
    }, err => {
      expect(err).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
      jasmine.clock().uninstall();
      done();
    });

    jasmine.clock().tick(10000);
  });

  it('rejects promise when destroyed', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`
    });

    bridge.promise.then(child => {
      // Do nothing.
    }, err => {
      expect(err).toBe(ERROR_CODES.DESTROYED);
      done();
    });

    bridge.destroy();
  });

  it('removes iframe when destroyed', () => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`
    });

    bridge.destroy();

    expect(bridge.iframe.parentNode).toBeNull();
  });

  it('allows debugging to be enabled', () => {
    spyOn(console, 'log');

    setDebug(true);

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`
    });

    expect(console.log).toHaveBeenCalledWith('[Penpal]', 'Parent: Loading iframe');
  });
});
