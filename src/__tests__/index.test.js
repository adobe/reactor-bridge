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

import { loadIframe, ERROR_CODES } from '../parent';

describe('parent', () => {
  let bridge;
  let iframe;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
  });

  afterEach(() => {
    if (bridge) {
      bridge.destroy();
    }
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  });

  it('provides a bridge API', done => {
    iframe.src = `http://${location.hostname}:9800/simpleSuccess.html`;
    bridge = loadIframe({
      iframe
    });

    expect(bridge.destroy).toEqual(jasmine.any(Function));
    bridge.promise.then(child => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.validate).toEqual(jasmine.any(Function));
      expect(child.getSettings).toEqual(jasmine.any(Function));
      done();
    });
  });

  it('bridgepath is properly set and the iframe loads with a functional bridge API', done => {
    iframe.src = `http://${location.hostname}:9800/simpleSuccess.html?bridgepath=/source/nested-app/`;
    bridge = loadIframe({
      iframe
    });

    expect(bridge.destroy).toEqual(jasmine.any(Function));
    bridge.promise.then(child => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.validate).toEqual(jasmine.any(Function));
      expect(child.getSettings).toEqual(jasmine.any(Function));
      done();
    });
  });

  it('proxies extension view API when values are returned', done => {
    iframe.src = `http://${location.hostname}:9800/extensionViewApiReturningValues.html`;
    bridge = loadIframe({
      iframe
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

  it('proxies extension view API when promises are returned', done => {
    iframe.src = `http://${location.hostname}:9800/extensionViewApiReturningPromises.html`
    bridge = loadIframe({
      iframe
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

  it('returns a rejected promise if validate returns a non-boolean value', done => {
    iframe.src = `http://${location.hostname}:9800/invalidReturnsValues.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      child.validate().then(
        () => {},
        error => {
          expect(error.message)
            .toContain('The extension attempted to return a non-boolean value from validate');
          done();
        }
      );
    });
  });

  it('returns a rejected promise if getSettings returns a non-object value', done => {
    iframe.src = `http://${location.hostname}:9800/invalidReturnsValues.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      child.getSettings().then(
        () => {},
        error => {
          expect(error.message)
            .toContain('The extension attempted to return a non-object value from getSettings');
          done();
        }
      );
    });
  });

  it('returns a rejected promise if validate returns a non-boolean promise', done => {
    iframe.src = `http://${location.hostname}:9800/invalidReturnsPromises.html`
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      child.validate().then(
        () => {},
        error => {
          expect(error.message)
            .toContain('The extension attempted to return a non-boolean value from validate');
          done();
        }
      );
    });
  });

  it('returns a rejected promise if getSettings returns a non-object promise', done => {
    iframe.src = `http://${location.hostname}:9800/invalidReturnsPromises.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      child.getSettings().then(
        () => {},
        error => {
          expect(error.message)
            .toContain('The extension attempted to return a non-object value from getSettings');
          done();
        }
      );
    });
  });

  it('times out if extension view doesn\'t register with bridge', done => {
    iframe.src = `http://${location.hostname}:9800/unregisteredInit.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(
      () => {},
      error => {
        expect(error).toBe('renderTimeout');
        done();
      }
    );
  });

  it('rejects load promise if extension view init function throws an error', done => {
    iframe.src = `http://${location.hostname}:9800/initFailure.html`
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(
      () => {},
      error => {
        expect(error.message).toBe('bad things');
        done();
      }
    );
  });

  it('returns a rejected promise if extension view has not registered ' +
      'getSettings (or validate) function', done => {
    iframe.src = `http://${location.hostname}:9800/unregisteredGetSettings.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      child.getSettings().then(
        () => {},
        error => {
          expect(error.message)
            .toContain('Unable to call getSettings on the extension. The extension must ' +
              'register a getSettings function using extensionBridge.register().');
          done();
        }
      );
    });
  });

  it('proxies lens API', done => {
    iframe.src = `http://${location.hostname}:9800/lensApi.html`;
    const addResultSuffix = options => options.testOption + ' result';

    bridge = loadIframe({
      iframe,
      openCodeEditor: addResultSuffix,
      openRegexTester: addResultSuffix,
      openDataElementSelector: addResultSuffix
    });

    bridge.promise.then(child => {
      // We abuse getSettings() for our testing purposes.
      child.getSettings().then(response => {
        expect(response.results).toEqual([
          'code editor result',
          'regex tester result',
          'data element selector result'
        ]);
        done();
      });
    });
  });

  it('rejects promise when connection fails', done => {
    jasmine.clock().install();

    iframe.src = `http://${location.hostname}:9800/connectionFailure.html`;
    bridge = loadIframe({
      iframe
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
    iframe.src = `http://${location.hostname}:9800/simpleSuccess.html`;
    bridge = loadIframe({
      iframe
    });

    bridge.promise.then(child => {
      // Do nothing.
    }, err => {
      expect(err).toBe(ERROR_CODES.DESTROYED);
      done();
    });

    bridge.destroy();
  });

  it('allows debugging to be enabled', (done) => {
    spyOn(console, 'log');

    iframe.src = `http://${location.hostname}:9800/simpleSuccess.html`;
    bridge = loadIframe({
      iframe,
      debug: true
    });

    expect(console.log).toHaveBeenCalledWith('[Penpal]', 'Parent: Awaiting handshake');
    bridge.promise.then(done);
  });

  it('times out if extension get settings doesn\'t respond in timely manner', done => {
    iframe.src = `http://${location.hostname}:9800/extensionTookTooLongToRespond.html`;
    bridge = loadIframe({
      iframe,
      extensionResponseTimeoutDuration: 100
    });

    bridge.promise.then(child => {
      child.getSettings().then(
        () => {},
        error => {
          expect(error).toBe('extensionResponseTimeout');
          done();
        }
      );
    });
  });

  it('times out if extension validate doesn\'t respond in timely manner', done => {
    iframe.src = `http://${location.hostname}:9800/extensionTookTooLongToRespond.html`;
    bridge = loadIframe({
      iframe,
      extensionResponseTimeoutDuration: 100
    });

    bridge.promise.then(child => {
      child.validate().then(
        () => {},
        error => {
          expect(error).toBe('extensionResponseTimeout');
          done();
        }
      );
    });
  });
});
