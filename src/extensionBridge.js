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
    configuration: {
      src: '',
      settings: {},
      propertySettings: {},
      schema: {},
      extensionConfigurations: [{}]
    }
  }

  var lastConfiguration = cloneDeep(iframe.bridge.configuration);

  var validateConfigurationAndUpdateIframe = function() {
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

  // generic getter/setter to trigger internal updates when configuration changes
  var configurationItemGetterSetter = {
    _configurationItem: {},
    get () { return this._configurationItem; },
    set (configurationItem) {
      this._configurationItem = configurationItem;
      validateConfigurationAndUpdateIframe();
    }
  };

  iframe.bridge.configurations = configurationItemGetterSetter;
  iframe.bridge.configuration.src = configurationItemGetterSetter;
  iframe.bridge.configuration.settings = configurationItemGetterSetter;
  iframe.bridge.configuration.propertySettings = configurationItemGetterSetter;
  iframe.bridge.configuration.schema = configurationItemGetterSetter;
  iframe.bridge.configuration.extensionConfigurations = configurationItemGetterSetter;

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
