# turbine-gulp-iframe-utils-builder

This project provides gulp tasks for creating a bundle file that can be injected by extension developers in their views. The bundle file is containing:

* [jschannel](https://github.com/mozilla/jschannel)
* [extensionBridge.contentWindow](https://git.corp.adobe.com/reactor/lens-extension-bridge/tree/master/src)
* [ajv JSON Schema Validator](https://github.com/epoberezkin/ajv)
* [Coral UI](https://git.corp.adobe.com/Coral/coralui)

# building
To build the bundle file, run `gulp iframeutilsbuilder` from the command line within your project's directory. The bundle files will be placed in the `dist` folder.
