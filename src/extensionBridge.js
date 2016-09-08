'use strict';
var getChannelSenders = require('./getChannelSenders');
var attachChannelReceivers = require('./attachChannelReceivers');
var Channel = require('@reactor/jschannel');
var iframeResizer = require('iframe-resizer').iframeResizer;
var frameboyant = require('@reactor/frameboyant/frameboyant');
var createRenderCompleteState = require('./createRenderCompleteState');

module.exports = function(iframe) {
  if (iframe.bridge) { return iframe; }

  var channel = Channel.build({
    iframe: iframe,
    origin: '*',
    scope: 'extensionBridge',
    reconnect: true
  });

  var bridgeConfiguration;

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
      onInitialRenderComplete: function() {},
      onIframeWindowReset: function() {}
    },

    _currentConfiguration: getNewConfiguration(),
    get configuration() {
      return this._currentConfiguration;
    },
    set configuration(newConfiguration) {
      this._currentConfiguration = getNewConfiguration(newConfiguration);
    }
  };

  function getNewConfiguration(newConfiguration) {
    bridgeConfiguration = {
      src: newConfiguration && newConfiguration.src || '',
      settings: newConfiguration && newConfiguration.settings || null,
      propertySettings: newConfiguration && newConfiguration.propertySettings || {},
      schema: newConfiguration && newConfiguration.schema || {},
      extensionConfigurations: newConfiguration && newConfiguration.extensionConfigurations || [{}],
      tokens: newConfiguration && newConfiguration.tokens || {},
      companyInfo: newConfiguration && newConfiguration.companyInfo || {}
    };

    if(newConfiguration) { validateConfigurationAndUpdateIframe(bridgeConfiguration); }

    return {
      get src() { return bridgeConfiguration.src },
      set src(newValue) { bridgeConfiguration.src = newValue; validateConfigurationAndUpdateIframe(); },
      get settings() { return bridgeConfiguration.settings; },
      set settings(newValue) { bridgeConfiguration.settings = newValue; validateConfigurationAndUpdateIframe(); },
      get propertySettings() { return bridgeConfiguration.propertySettings; },
      set propertySettings(newValue) { bridgeConfiguration.propertySettings = newValue; validateConfigurationAndUpdateIframe(); },
      get schema() { return bridgeConfiguration.schema; },
      set schema(newValue) { bridgeConfiguration.schema = newValue; validateConfigurationAndUpdateIframe(); },
      get extensionConfigurations() { return bridgeConfiguration.extensionConfigurations; },
      set extensionConfigurations(newValue) { bridgeConfiguration.extensionConfigurations = newValue; validateConfigurationAndUpdateIframe(); },
      get tokens() { return bridgeConfiguration.tokens; },
      set tokens(newValue) { bridgeConfiguration.tokens = newValue; validateConfigurationAndUpdateIframe(); },
      get companyInfo() { return bridgeConfiguration.companyInfo; },
      set companyInfo(newValue) { bridgeConfiguration.companyInfo = newValue; validateConfigurationAndUpdateIframe(); }
    };
  }

  function absolutePath(href) {
      var link = document.createElement("a");
      link.href = href;
      return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
  }

  function validateConfigurationAndUpdateIframe() {
    var configurationIsValid = configurationItemsAreValid();

    if(configurationIsValid) {
      if(iframe.src !== absolutePath(bridgeConfiguration.src)) {
        iframe.src = bridgeConfiguration.src;
        attachReadyFunctions();
      }

      debounceInit();
    }
  }

  function configurationItemsAreValid() {
    var ignoredKeys = ['settings'];
    var keys = Object.keys(bridgeConfiguration)
      .filter(function(key) { return ignoredKeys.indexOf(key) === -1; });

    keys.forEach(function(key) {
      // src is valid as an empty string so we have to check differently
      // for it than for the other properties
      if ((key === 'src' && typeof bridgeConfiguration[key] !== 'string')
        || (key !== 'src' && !bridgeConfiguration[key])) {
        console.warn('You must define iframe.configuration.' + key);
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
    resetIframeWindow: function() {
      iframe.bridge.api.onIframeWindowReset();
      renderCompleteState.reset()
    },
    openCodeEditor: function() {
      if (iframe.bridge.api.openCodeEditor) {
        iframe.bridge.api.openCodeEditor.apply(null, arguments);
      } else {
        console.warn('You must define iframe.bridge.api.openCodeEditor');
      }
    },
    openRegexTester: function() {
      if (iframe.bridge.api.openRegexTester) {
        iframe.bridge.api.openRegexTester.apply(null, arguments);
      } else {
        console.warn('You must define iframe.bridge.api.openRegexTester');
      }
    },
    openDataElementSelector: function() {
      if (iframe.bridge.api.openDataElementSelector) {
        iframe.bridge.api.openDataElementSelector.apply(null, arguments);
      } else {
        console.warn('You must define iframe.bridge.api.openDataElementSelector');
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
      iframe.bridge.api.init({
        settings: bridgeConfiguration.settings,
        propertySettings: bridgeConfiguration.propertySettings,
        schema: bridgeConfiguration.schema,
        extensionConfigurations: bridgeConfiguration.extensionConfigurations,
        tokens: bridgeConfiguration.tokens,
        companyInfo: bridgeConfiguration.companyInfo
      });
    });
  }

  iframeResizer({
    checkOrigin: false,
    resizedCallback: renderCompleteState.markIframeResizerReady
  }, iframe);

  return iframe;
};
