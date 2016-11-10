/**
 * Creates a style block, adds CSS to it, then adds the block to the page.
 * @param {string} The CSS to be applied to the page.
 */
export default css => {
  const styleTag = document.createElement('style');
  styleTag.appendChild(document.createTextNode(css));
  document.head.appendChild(styleTag);
};
