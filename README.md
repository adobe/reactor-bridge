# turbine-windgoogles

This project provides classes and gulp tasks used by reactor project. 

# Building IFrame Utils files

To build the files that are used in the turbine extension views, run `gulp windgoggles:buildIframeUtils` from the command line within your project's directory. The bundle files will be placed in the `dist` folder.

The bundle file is containing:
* [extensionBridge.contentWindow](https://git.corp.adobe.com/reactor/lens-extension-bridge/tree/master/src)
* [frameboyant](https://git.corp.adobe.com/reactor/frameboyant)
* [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer)
* [Coral UI](https://git.corp.adobe.com/Coral/coralui)
