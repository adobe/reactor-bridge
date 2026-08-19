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

const { test, expect } = require('@playwright/test');

const CHILD_ORIGIN = 'http://localhost:9800';

// Sets up an iframe pointing at the given fixture and calls loadIframe() in the
// page context. Stores bridge/result/error on window so subsequent evaluate()
// calls can reach them.
async function setupBridge(page, fixturePath, options = {}) {
  await page.evaluate(({ src, opts }) => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.src = src;
    window._iframe = iframe;
    window._bridgeResult = null;
    window._bridgeError = null;
    window._bridge = window.ExtensionBridge.loadIframe({ iframe, ...opts });
    window._bridge.promise
      .then(child => { window._bridgeResult = child; })
      .catch(err  => { window._bridgeError  = err instanceof Error ? err.message : String(err); });
  }, { src: `${CHILD_ORIGIN}/${fixturePath}`, opts: options });
}

async function waitForBridge(page) {
  await page.waitForFunction(
    () => window._bridgeResult !== null || window._bridgeError !== null,
    { timeout: 15000 }
  );
}

async function callChildMethod(page, method) {
  await page.evaluate(m => {
    window._childResult = undefined;
    window._bridgeResult[m]()
      .then(v => { window._childResult = v === undefined ? '__undefined__' : v; })
      .catch(e => { window._childResult = { __error: e.message || String(e) }; });
  }, method);
  await page.waitForFunction(() => window._childResult !== undefined, { timeout: 10000 });
  return page.evaluate(() =>
    window._childResult === '__undefined__' ? undefined : window._childResult
  );
}

test.describe('parent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness.html');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      try { window._bridge?.destroy(); } catch (e) {}
      if (window._iframe?.parentNode) {
        window._iframe.parentNode.removeChild(window._iframe);
      }
    });
  });

  test('provides a bridge API', async ({ page }) => {
    await setupBridge(page, 'simpleSuccess.html');
    await waitForBridge(page);

    const types = await page.evaluate(() => ({
      init: typeof window._bridgeResult.init,
      validate: typeof window._bridgeResult.validate,
      getSettings: typeof window._bridgeResult.getSettings,
      destroy: typeof window._bridge.destroy
    }));
    expect(types.destroy).toBe('function');
    expect(types.init).toBe('function');
    expect(types.validate).toBe('function');
    expect(types.getSettings).toBe('function');
  });

  test('bridgepath is properly set and the iframe loads with a functional bridge API', async ({ page }) => {
    await setupBridge(page, 'extensionViewGetSettingsReturnChildScriptPath.html?bridgepath=/source/nested-app/');
    await waitForBridge(page);

    const types = await page.evaluate(() => ({
      init: typeof window._bridgeResult.init,
      validate: typeof window._bridgeResult.validate,
      getSettings: typeof window._bridgeResult.getSettings
    }));
    expect(types.init).toBe('function');
    expect(types.validate).toBe('function');
    expect(types.getSettings).toBe('function');

    const { childScriptPath } = await callChildMethod(page, 'getSettings');
    expect(childScriptPath).toEqual('http://localhost:9801/source/nested-app/extensionbridge/extensionbridge-child.js');
  });

  test('bridgepath contains dots child script defaults to root of parent', async ({ page }) => {
    await setupBridge(page, 'extensionViewGetSettingsReturnChildScriptPath.html?bridgepath=/source/../../../nested-app/');
    await waitForBridge(page);

    const { childScriptPath } = await callChildMethod(page, 'getSettings');
    expect(childScriptPath).toEqual('http://localhost:9801/extensionbridge/extensionbridge-child.js');
  });

  test('bridgepath contains * child script defaults to root of parent', async ({ page }) => {
    await setupBridge(page, 'extensionViewGetSettingsReturnChildScriptPath.html?bridgepath=/source/*nested-app/');
    await waitForBridge(page);

    const { childScriptPath } = await callChildMethod(page, 'getSettings');
    expect(childScriptPath).toEqual('http://localhost:9801/extensionbridge/extensionbridge-child.js');
  });

  test('bridgepath does not start with / child script defaults to root of parent', async ({ page }) => {
    await setupBridge(page, 'extensionViewGetSettingsReturnChildScriptPath.html?bridgepath=source/nested-app/');
    await waitForBridge(page);

    const { childScriptPath } = await callChildMethod(page, 'getSettings');
    expect(childScriptPath).toEqual('http://localhost:9801/extensionbridge/extensionbridge-child.js');
  });

  test('proxies extension view API when values are returned', async ({ page }) => {
    await setupBridge(page, 'extensionViewApiReturningValues.html');
    await waitForBridge(page);

    const initResult = await callChildMethod(page, 'init');
    const validateResult = await callChildMethod(page, 'validate');
    const settingsResult = await callChildMethod(page, 'getSettings');
    expect(initResult).toBeUndefined();
    expect(validateResult).toBe(false);
    expect(settingsResult).toEqual({ foo: 'bar' });
  });

  test('proxies extension view API when promises are returned', async ({ page }) => {
    await setupBridge(page, 'extensionViewApiReturningPromises.html');
    await waitForBridge(page);

    const initResult = await callChildMethod(page, 'init');
    const validateResult = await callChildMethod(page, 'validate');
    const settingsResult = await callChildMethod(page, 'getSettings');
    expect(initResult).toBeUndefined();
    expect(validateResult).toBe(false);
    expect(settingsResult).toEqual({ foo: 'bar' });
  });

  test('returns a rejected promise if validate returns a non-boolean value', async ({ page }) => {
    await setupBridge(page, 'invalidReturnsValues.html');
    await waitForBridge(page);

    const result = await callChildMethod(page, 'validate');
    expect(result.__error).toContain('The extension attempted to return a non-boolean value from validate');
  });

  test('returns a rejected promise if getSettings returns a non-object value', async ({ page }) => {
    await setupBridge(page, 'invalidReturnsValues.html');
    await waitForBridge(page);

    const result = await callChildMethod(page, 'getSettings');
    expect(result.__error).toContain('The extension attempted to return a non-object value from getSettings');
  });

  test('returns a rejected promise if validate returns a non-boolean promise', async ({ page }) => {
    await setupBridge(page, 'invalidReturnsPromises.html');
    await waitForBridge(page);

    const result = await callChildMethod(page, 'validate');
    expect(result.__error).toContain('The extension attempted to return a non-boolean value from validate');
  });

  test('returns a rejected promise if getSettings returns a non-object promise', async ({ page }) => {
    await setupBridge(page, 'invalidReturnsPromises.html');
    await waitForBridge(page);

    const result = await callChildMethod(page, 'getSettings');
    expect(result.__error).toContain('The extension attempted to return a non-object value from getSettings');
  });

  test('times out if extension view doesn\'t register with bridge', async ({ page }) => {
    await setupBridge(page, 'unregisteredInit.html');
    await waitForBridge(page);

    const error = await page.evaluate(() => window._bridgeError);
    expect(error).toBe('renderTimeout');
  });

  test('rejects load promise if extension view init function throws an error', async ({ page }) => {
    await setupBridge(page, 'initFailure.html');
    await waitForBridge(page);

    const error = await page.evaluate(() => window._bridgeError);
    expect(error).toBe('bad things');
  });

  test('returns a rejected promise if extension view has not registered getSettings (or validate) function', async ({ page }) => {
    await setupBridge(page, 'unregisteredGetSettings.html');
    await waitForBridge(page);

    const result = await callChildMethod(page, 'getSettings');
    expect(result.__error).toContain(
      'Unable to call getSettings on the extension. The extension must ' +
      'register a getSettings function using extensionBridge.register().'
    );
  });

  test('proxies lens API', async ({ page }) => {
    // Functions can't be serialized through page.evaluate(), so set up inline
    await page.evaluate(src => {
      const addResultSuffix = options => options.testOption + ' result';
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.src = src;
      window._iframe = iframe;
      window._bridgeResult = null;
      window._bridgeError = null;
      window._bridge = window.ExtensionBridge.loadIframe({
        iframe,
        openCodeEditor: addResultSuffix,
        openRegexTester: addResultSuffix,
        openDataElementSelector: addResultSuffix
      });
      window._bridge.promise
        .then(child => { window._bridgeResult = child; })
        .catch(err  => { window._bridgeError  = err instanceof Error ? err.message : String(err); });
    }, `${CHILD_ORIGIN}/lensApi.html`);
    await waitForBridge(page);

    const response = await callChildMethod(page, 'getSettings');
    expect(response.results).toEqual([
      'code editor result',
      'regex tester result',
      'data element selector result'
    ]);
  });

  test('rejects promise when connection fails', async ({ page }) => {
    await setupBridge(page, 'connectionFailure.html', { connectionTimeoutDuration: 100 });
    await waitForBridge(page);

    const error = await page.evaluate(() => window._bridgeError);
    expect(error).toBe('connectionTimeout');
  });

  test('rejects promise when destroyed', async ({ page }) => {
    await page.evaluate(src => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.src = src;
      window._iframe = iframe;
      window._bridgeResult = null;
      window._bridgeError = null;
      window._bridge = window.ExtensionBridge.loadIframe({ iframe });
      window._bridge.promise
        .then(child => { window._bridgeResult = child; })
        .catch(err  => { window._bridgeError  = err instanceof Error ? err.message : String(err); });
      window._bridge.destroy();
    }, `${CHILD_ORIGIN}/simpleSuccess.html`);

    await page.waitForFunction(
      () => window._bridgeResult !== null || window._bridgeError !== null,
      { timeout: 5000 }
    );

    const error = await page.evaluate(() => window._bridgeError);
    expect(error).toBe('destroyed');
  });

  test('allows debugging to be enabled', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await setupBridge(page, 'simpleSuccess.html', { debug: true });
    await waitForBridge(page);

    expect(logs.some(m => m.includes('[Penpal]') && m.includes('Awaiting handshake'))).toBe(true);
  });

  test('times out if extension get settings doesn\'t respond in timely manner', async ({ page }) => {
    await setupBridge(page, 'extensionTookTooLongToRespond.html', { extensionResponseTimeoutDuration: 100 });
    await waitForBridge(page);

    const result = await callChildMethod(page, 'getSettings');
    expect(result.__error).toBe('extensionResponseTimeout');
  });

  test('times out if extension validate doesn\'t respond in timely manner', async ({ page }) => {
    await setupBridge(page, 'extensionTookTooLongToRespond.html', { extensionResponseTimeoutDuration: 100 });
    await waitForBridge(page);

    const result = await callChildMethod(page, 'validate');
    expect(result.__error).toBe('extensionResponseTimeout');
  });
});
