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
