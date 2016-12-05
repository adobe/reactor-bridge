import { loadIframe, ERROR_CODES } from '../parent';

describe('parent', () => {
  it('loads an iframe and provides API', done => {
    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html'
    });

    expect(bridge.iframe).toEqual(jasmine.any(HTMLIFrameElement));
    expect(bridge.rootNode).toEqual(jasmine.any(HTMLDivElement));
    expect(bridge.destroy).toEqual(jasmine.any(Function));

    bridge.promise.then(child => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.validate).toEqual(jasmine.any(Function));
      expect(child.getSettings).toEqual(jasmine.any(Function));
      bridge.destroy();
      done();
    });
  });

  it('loads an iframe into specified container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html',
      container
    });

    expect(container.querySelector('iframe')).toBe(bridge.iframe);
    bridge.destroy();
  });

  it('sets sandbox attribute on iframe', () => {
    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html',
    });

    expect(bridge.iframe.getAttribute('sandbox'))
      .toBe('allow-same-origin allow-scripts allow-popups');
    bridge.destroy();
  });

  it('sizes the frameboyant root to the iframe content height during initialization', done => {
    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html',
    });

    bridge.promise.then(child => {
      expect(parseFloat(bridge.rootNode.style.height)).toBeGreaterThan(0);
      done();
    });
  });

  it('sizes the frameboyant root to the iframe content height after initialization', done => {
    const bridge = loadIframe({
      url: 'http://localhost:9800/resize.html',
    });

    bridge.promise.then(child => {
      var beforeSize = parseFloat(bridge.rootNode.style.height);
      // We abuse validate() for our testing purposes.
      child.validate().then(function() {
        var afterSize = parseFloat(bridge.rootNode.style.height);
        expect(beforeSize + 100).toEqual(afterSize);
        done();
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

    const bridge = loadIframe({
      url: 'http://localhost:9800/editMode.html',
      container: relativelyPositionedParent,
      editModeBoundsContainer: boundsContainer
    });

    bridge.promise.then(child => {
      // We abuse validate() for our testing purposes to trigger edit mode.
      child.validate().then(() => {
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
    loadIframe({
      url: 'http://localhost:9800/extensionViewApi.html'
    }).promise.then(child => {
      Promise.all([
        child.init(),
        child.validate(),
        child.getSettings()
      ]).then(result => {
        expect(result).toEqual([
          'init called',
          false,
          {
            foo: 'bar'
          }
        ]);
        done();
      });
    });
  });

  it('proxies lens API', done => {
    const addResultSuffix = code => code + ' result';

    loadIframe({
      url: 'http://localhost:9800/lensApi.html',
      openCodeEditor: addResultSuffix,
      openRegexTester: addResultSuffix,
      openDataElementSelector: addResultSuffix,
      openCssSelector: addResultSuffix
    }).promise.then(child => {
      // We abuse validate() for our testing purposes.
      child.validate().then(result => {
        expect(result).toEqual([
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

    loadIframe({
      url: 'http://localhost:9800/connectionFailure.html'
    }).promise.then(child => {
      // Do nothing.
    }, err => {
      expect(err).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
      done();
    });

    jasmine.clock().tick(10000);
  });

  it('rejects promise when destroyed', done => {
    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html'
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
    const bridge = loadIframe({
      url: 'http://localhost:9800/simpleSuccess.html'
    });

    bridge.destroy();

    expect(bridge.iframe.parentNode).toBeNull();
  });
});
