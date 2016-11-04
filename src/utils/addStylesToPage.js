/**
 * Creates a style block, adds CSS to it, then adds the block to the page.
 * @param {string} The CSS to be applied to the page.
 */
export default css => {
  var styleTag = document.createElement('style');

  styleTag.type = 'text/css';
  if (styleTag.styleSheet){
    styleTag.styleSheet.cssText = css;
  } else {
    styleTag.appendChild(document.createTextNode(css));
  }

  (document.head || document.getElementsByTagName('head')[0]).appendChild(styleTag);
};
