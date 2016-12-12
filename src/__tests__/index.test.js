import Promise from 'native-promise-only-ponyfill';
import RSVP from 'rsvp';
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
    expect(bridge.rootNode).toEqual(jasmine.any(HTMLDivElement));
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

  it('sizes the frameboyant root to the iframe content height during initialization', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`,
    });

    bridge.promise.then(child => {
      expect(parseFloat(bridge.rootNode.style.height)).toBeGreaterThan(0);
      done();
    });
  });

  it('sizes the frameboyant root to the iframe content height after initialization', done => {
    bridge = loadIframe({
      url: `http://${location.hostname}:9800/resize.html`,
    });

    bridge.promise.then(child => {
      var beforeSize = parseFloat(bridge.rootNode.style.height);
      // We abuse validate() for our testing purposes.
      child.validate().then(function() {
        // The mutation observer that detects that the iframe's content size has changed is
        // throttled so we need to wait at least that amount before being sure that the iframe
        // sends its new content size to the parent. We can't really use a jasmine clock here
        // because the throttling timeout is within the iframe so mocking the clock in the parent
        // window wouldn't affect the throttling.
        setTimeout(() => {
          var afterSize = parseFloat(bridge.rootNode.style.height);
          expect(beforeSize + 100).toEqual(afterSize);
          done();
        }, 50);
      });
    });
  });

  it('positions and sizes iframe when toggling edit mode', done => {
    const boundsContainer = document.createElement('div');
    boundsContainer.style.margin = '10px';
    boundsContainer.style.padding = '20px';
    boundsContainer.style.height = '500px';
    boundsContainer.style.width = '500px';
    boundsContainer.style.border = '5px solid red';
    document.body.appendChild(boundsContainer);

    const relativelyPositionedParent = document.createElement('div');
    relativelyPositionedParent.style.position = 'relative';
    relativelyPositionedParent.style.padding = '4px';
    relativelyPositionedParent.style.border = '1px solid blue';
    boundsContainer.appendChild(relativelyPositionedParent);

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/editMode.html`,
      container: relativelyPositionedParent,
      editModeBoundsContainer: boundsContainer
    });

    bridge.promise.then(child => {
      child.enterEditMode().then(() => {
        const iframeContainer = bridge.rootNode.querySelector('.frameboyantIframeContainer');
        const iframeContainerComputedStyle = getComputedStyle(iframeContainer);
        const boundsContainerRect = boundsContainer.getBoundingClientRect();
        const iframeRect = bridge.iframe.getBoundingClientRect();

        expect(iframeContainerComputedStyle.position).toBe('absolute');

        // The iframe should have the same rect as the bounds container excluding any border
        // the bounds container has.
        expect(iframeRect.top).toBe(boundsContainerRect.top + 5);
        expect(iframeRect.left).toBe(boundsContainerRect.left + 5);
        expect(iframeRect.width).toBe(boundsContainerRect.width - 10);
        expect(iframeRect.height).toBe(boundsContainerRect.height - 10);

        // We abuse getSettings() for our testing purposes to get the iframe body styles.
        return child.getSettings();
      }).then(bodyStyles => {
        expect(parseInt(bodyStyles.marginTop)).toBe(25);
        expect(parseInt(bodyStyles.marginLeft)).toBe(25);
        expect(parseInt(bodyStyles.width)).toBe(490);

        return child.exitEditMode();
      }).then(() => {
        const iframeContainer = bridge.rootNode.querySelector('.frameboyantIframeContainer');
        const iframeContainerComputedStyle = getComputedStyle(iframeContainer);
        const boundsContainerRect = boundsContainer.getBoundingClientRect();
        const iframeRect = bridge.iframe.getBoundingClientRect();

        expect(iframeContainerComputedStyle.position).toBe('static');
        expect(iframeRect.top).toBe(boundsContainerRect.top + 30);
        expect(iframeRect.left).toBe(boundsContainerRect.left + 30);
        expect(iframeRect.width).toBe(boundsContainerRect.width - 60);
        expect(iframeRect.height).toBeLessThan(boundsContainerRect.height);
        done();
      })
    });
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
    jasmine.clock().install();

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/unregisteredInit.html`
    });

    bridge.promise.then(
      () => {},
      error => {
        expect(error).toBe('connectionTimeout');
        jasmine.clock().uninstall();
        done();
      }
    );

    jasmine.clock().tick(10000);
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
      expect(err).toBe('Extension bridge destroyed');
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

  it('allows a custom promise implementation to be used', () => {
    // We can't use native-promise-only-ponyfill to test this one because it will just expose
    // the native promise implementation when available.
    setPromise(RSVP.Promise);

    bridge = loadIframe({
      url: `http://${location.hostname}:9800/simpleSuccess.html`
    });

    expect(bridge.promise).toEqual(jasmine.any(RSVP.Promise));
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
