const Logger = function(moduleName) {
  this.moduleName = moduleName;
};

['log', 'info', 'warn', 'error'].forEach(methodName => {
  Logger.prototype[methodName] = function(...args) {
    if (Logger.enabled) {
      console[methodName](`[${this.moduleName}]`, ...args);
    }
  }
});

Logger.enabled = false;

export default Logger;
