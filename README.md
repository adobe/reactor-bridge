# extension-bridge

This project provides classes and gulp tasks used by reactor project. 

# Dependencies installation

You need to setup the Reactor NPM registry to install all the packages from the `@reactor` scope. Before running `npm install`, run

```
npm config set @reactor:registry https://artifactory.corp.adobe.com/artifactory/api/npm/npm-mcps-release-local/
```

# Building IFrame Utils files

To build the files that are used in the turbine extension views, run `gulp extensionBridge:buildIframeUtils` from the command line within your project's directory. The bundle files will be placed in the `dist` folder.

The bundle file is containing:
* Iframe communication APIs for building rules and data elements.
* [frameboyant](https://git.corp.adobe.com/reactor/frameboyant)
* [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer)
