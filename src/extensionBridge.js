'use strict';
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var Channel = require('jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var createRenderCompleteState = require('./createRenderCompleteState');
var cloneDeep = require('lodash.cloneDeep');
var isEqual = require('lodash.isEqual');

module.exports = function(iframe) {
  if (iframe.bridge) { return iframe; }

  var channel = Channel.build({
    window: iframe.contentWindow,
    origin: '*',
    scope: 'extensionBridge'
  });
  var channelSenders = getChannelSenders(channel);

  var destroyExtensionBridge = function() {
    frameboyant.removeIframe(iframe);
    // This also removes the iframe from its parent. Not really what we're going for
    // (we're just trying to clean up listeners and such) but not hurting anything at the moment.
    iframe.iFrameResizer.close();
    channel.destroy();
  };
  iframe.destroyExtensionBridge = destroyExtensionBridge;


  // generic getter/setter to trigger internal updates when configuration changes
  // var configurationItemGetterSetter = {
  //   _configurationItem: {},
  //   get: function() {
  //     console.log(this);
  //     return this._configurationItem;
  //   },
  //   set: function(configurationItem) {
  //     debugger;
  //     this._configurationItem = configurationItem;
  //
  //     // if this is iframe.bridge.configuration
  //     // applyBridgeGettersSetters();
  //   }
  // };

  iframe.bridge = {
    api: {
      init: channelSenders.init,
      validate: channelSenders.validate,
      getSettings: channelSenders.getSettings,
      destroy: destroyExtensionBridge,
      openCodeEditor: null,
      openRegexTester: null,
      openDataElementSelector: null,
      onInitialRenderComplete: function() {}
    },

    _currentConfiguration: {
      src: '',
      settings: {},
      propertySettings: {},
      schema: {},
      extensionConfigurations: [{}]
    },
    get configuration() {
      return this._currentConfiguration;
    },
    set configuration(newConfiguration) {
      this._currentConfiguration = newConfiguration;
    },
    setConfigurationProperty: function(name, value) {

    }
  }

//   var _currentConfiguration = {
//     src: '',
//     settings: {},
//     propertySettings: {},
//     schema: {},
//     extensionConfigurations: [{}]
//   };
//   Object.defineProperty(iframe.bridge,
//     'configuration', {
//       get() {
// console.log('get');
//         return _currentConfiguration;
//       },
//       set(newConfiguration) {
// console.log('set', newConfiguration);
//         _currentConfiguration = newConfiguration;
//       }
//     });

  // iframe.bridge.configuration = configurationItemGetterSetter;
  // iframe.bridge.configuration.src = configurationItemGetterSetter;
  // iframe.bridge.configuration.settings = configurationItemGetterSetter;
  // iframe.bridge.configuration.propertySettings = configurationItemGetterSetter;
  // iframe.bridge.configuration.schema = configurationItemGetterSetter;
  // iframe.bridge.configuration.extensionConfigurations = configurationItemGetterSetter;

  var lastConfiguration = cloneDeep(iframe.bridge.configuration);

  var validateConfigurationAndUpdateIframe = function() {
    debugger;

    var configurationIsValid = configurationItemsAreValid();
    var configurationHasChanged = !isEqual(lastConfiguration, iframe.bridge.configuration);

    if(configurationHasChanged && configurationIsValid) {
      var configuration = iframe.bridge.configuration;
      if(iframe.src !== configuration.src) {
        iframe.src = configuration.src;
        attachReadyFunctions();
      }

      iframe.bridge.init({
        settings: configuration.settings,
        propertySettings: configuration.propertySettings,
        schema: configuration.schema,
        extensionConfigurations: configuration.extensionConfigurations
      });
    }
  }

  var configurationItemsAreValid = function() {
    var keys = Object.keys(iframe.bridge.configuration);
    keys.forEach(function(key, index) {
      if (!iframe.bridge.configuration[key]) {
        console.error('You must define iframe.configuration.' + key);
        return false;
      }
    });
    return true;
  }

  // Object.defineProperties(iframe.bridge, {
  //   'configuration': {
  //     set: function (value) {
  //       console.log('iframe.bridge.configuration set to ', value);
  //       this.configuration = value;
  //       validateConfigurationAndUpdateIframe();
  //       applyBridgeGettersSetters();
  //     }
  //   }
  // });
  // var applyBridgeGettersSetters = function() {
  //   console.log(iframe.bridge.configuration);
  //   if(iframe.bridge.configuration) {
  //     Object.defineProperties(iframe.bridge.configuration, {
  //       'src': {
  //         set: function (value) {
  //           this.src = value;
  //           validateConfigurationAndUpdateIframe();
  //         }
  //       },
  //       'settings': {
  //         set: function (value) {
  //           this.settings = value;
  //           validateConfigurationAndUpdateIframe();
  //         }
  //       },
  //       'propertySettings': {
  //         set: function (value) {
  //           this.propertySettings = value;
  //           validateConfigurationAndUpdateIframe();
  //         }
  //       },
  //       'schema': {
  //         set: function (value) {
  //           this.schema = value;
  //           validateConfigurationAndUpdateIframe();
  //         }
  //       },
  //       'extensionConfigurations': {
  //         set: function (value) {
  //           this.extensionConfigurations = value;
  //           validateConfigurationAndUpdateIframe();
  //         }
  //       }
  //     });
  //   }
  // }
  // applyBridgeGettersSetters();

  var renderCompleteState = createRenderCompleteState(iframe.bridge.onInitialRenderComplete);


  attachChannelReceivers(channel, {
    openCodeEditor: function() {
      if (iframe.bridge.openCodeEditor) {
        iframe.bridge.openCodeEditor.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.openCodeEditor');
      }
    },
    openRegexTester: function() {
      if (iframe.bridge.openRegexTester) {
        iframe.bridge.openRegexTester.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.openRegexTester');
      }
    },
    openDataElementSelector: function() {
      if (iframe.bridge.openDataElementSelector) {
        iframe.bridge.openDataElementSelector.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.openDataElementSelector');
      }
    }
  });

  var attachReadyFunctions = function() {
    attachChannelReceivers(channel, {
      domReadyCallback: renderCompleteState.markDomReady
    });
    frameboyant.addIframe(iframe, {
      stylesAppliedCallback: renderCompleteState.markStylesReady
    });
  }

  iframeResizer({
    checkOrigin: false
  }, iframe);

  return iframe;
};
