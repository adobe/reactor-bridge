'use strict';
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var Channel = require('@reactor/jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var createRenderCompleteState = require('./createRenderCompleteState');
var cloneDeep = require('lodash.cloneDeep');
var isEqual = require('lodash.isEqual');

module.exports = function(iframe) {
  if (iframe.bridge) { return iframe; }
  var channel;

  function buildChannel() {
    console.log('buildChannel', iframe);
    channel = Channel.build({
      iframe: iframe,
      origin: '*',
      scope: 'extensionBridge',
      debugOutput: true,
      reconnect: true
    });
  }
  buildChannel();
  var channelSenders = getChannelSenders(channel);

  var destroyExtensionBridge = function() {
    frameboyant.removeIframe(iframe);
    // This also removes the iframe from its parent. Not really what we're going for
    // (we're just trying to clean up listeners and such) but not hurting anything at the moment.
    iframe.iFrameResizer.close();
    channel.destroy();
  };
  iframe.destroyExtensionBridge = destroyExtensionBridge;

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

    _currentConfiguration: getNewConfiguration(),
    get configuration() {
      return this._currentConfiguration;
    },
    set configuration(newConfiguration) {
      this._currentConfiguration = getNewConfiguration(newConfiguration);
    }
  }

  function getNewConfiguration(newConfiguration) {
    var _src = newConfiguration && newConfiguration.src || '';
    var _settings = newConfiguration && newConfiguration.settings || {};
    var _propertySettings = newConfiguration && newConfiguration.propertySettings || {};
    var _schema = newConfiguration && newConfiguration.schema || {};
    var _extensionConfigurations = newConfiguration && newConfiguration.extensionConfigurations || [{}];

    if(newConfiguration) { validateConfigurationAndUpdateIframe(); }

    return {
      get src() { return _src },
      set src(newValue) { _src = newValue; validateConfigurationAndUpdateIframe(); },
      get settings() { return _settings; },
      set settings(newValue) { _settings = newValue; validateConfigurationAndUpdateIframe(); },
      get propertySettings() { return _propertySettings; },
      set propertySettings(newValue) { _propertySettings = newValue; validateConfigurationAndUpdateIframe(); },
      get schema() { return _schema; },
      set schema(newValue) { _schema = newValue; validateConfigurationAndUpdateIframe(); },
      get extensionConfigurations() { return _extensionConfigurations; },
      set extensionConfigurations(newValue) { _extensionConfigurations = newValue; validateConfigurationAndUpdateIframe(); }
    };
  };

  var lastConfiguration = cloneDeep(iframe.bridge.configuration);
  function validateConfigurationAndUpdateIframe() {
    var configurationHasChanged = !isEqual(lastConfiguration, cloneDeep(iframe.bridge.configuration));
    if(configurationHasChanged) {
      lastConfiguration = cloneDeep(iframe.bridge.configuration);
    }
    var configurationIsValid = configurationItemsAreValid();

    if(configurationHasChanged && configurationIsValid) {
      var configuration = iframe.bridge.configuration;
      if(iframe.src !== configuration.src) {
        iframe.src = configuration.src;
        // debugger;
        // channel.destroy();
        // buildChannel();
        attachReadyFunctions();
      }

      debounceInit();
    }
  }
  function configurationItemsAreValid() {
    var keys = Object.keys(iframe.bridge.configuration);
    keys.forEach(function(key, index) {
      if (!iframe.bridge.configuration[key]) {
        console.error('You must define iframe.configuration.' + key);
        return false;
      }
    });
    return true;
  }

  var renderCompleteState = createRenderCompleteState(function (){
    debounceInit();
    iframe.bridge.api.onInitialRenderComplete.apply(this, arguments);
  });

  attachChannelReceivers(channel, {
    domReadyCallback: renderCompleteState.markDomReady,
    openCodeEditor: function() {
      if (iframe.bridge.api.openCodeEditor) {
        iframe.bridge.api.openCodeEditor.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.api.openCodeEditor');
      }
    },
    openRegexTester: function() {
      if (iframe.bridge.api.openRegexTester) {
        iframe.bridge.api.openRegexTester.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.api.openRegexTester');
      }
    },
    openDataElementSelector: function() {
      if (iframe.bridge.api.openDataElementSelector) {
        iframe.bridge.api.openDataElementSelector.apply(null, arguments);
      } else {
        console.error('You must define iframe.bridge.api.openDataElementSelector');
      }
    }
  });

  function attachReadyFunctions() {
    frameboyant.addIframe(iframe, {
      stylesAppliedCallback: renderCompleteState.markStylesReady
    });
  }

  function debounceInit() {
    renderCompleteState.callHandlerIfComplete(function() {
      var configuration = iframe.bridge.configuration;
      iframe.bridge.api.init({
        settings: configuration.settings,
        propertySettings: configuration.propertySettings,
        schema: configuration.schema,
        extensionConfigurations: configuration.extensionConfigurations
      });
    });
  };

  iframeResizer({
    checkOrigin: false
  }, iframe);

  return iframe;
};
