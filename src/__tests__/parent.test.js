import { loadIframe } from '../parent';

describe('parent', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });

  it('asdf', (done) => {
    loadIframe({
      url: 'http://localhost:9800/child.html',
      container: document.body,
      extensionInitOptions: {},
    }).then(child => {
      done();
    })
  });
});
