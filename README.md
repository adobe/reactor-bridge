# turbine-gulp-windgoogles

This project provides gulp tasks for creating the bundle files used by reactor project. The bundle file is containing:

* [jschannel](https://github.com/mozilla/jschannel)
* [extensionBridge.contentWindow](https://git.corp.adobe.com/reactor/lens-extension-bridge/tree/master/src)
* [ajv JSON Schema Validator](https://github.com/epoberezkin/ajv)
* [Coral UI](https://git.corp.adobe.com/Coral/coralui)

# building
To build the bundle file, run `gulp iframeutilsbuilder:build` from the command line within your project's directory. The bundle files will be placed in the `dist` folder.
