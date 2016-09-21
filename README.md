# extension-support-bridge
[![Build Status][status-image]][status-url] [![NPM version][npm-image]][npm-url] [![NPM Dependencies][npm-dependencies-image]][npm-dependencies-url]

This project provides classes and gulp tasks used by reactor project. 

# Building IFrame Utils files

To build the files that are used in the turbine extension views, run `npm run build` from the command line within your project's directory. The bundle files will be placed in the `dist` folder.

The bundle file is containing:
* Iframe communication APIs for building rules and data elements.
* [frameboyant](https://git.corp.adobe.com/reactor/frameboyant)
* [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer)

[status-url]: https://dtm-builder.ut1.mcps.adobe.net/job/extension-support-bridge
[status-image]: https://dtm-builder.ut1.mcps.adobe.net/buildStatus/icon?job=extension-support-bridge
[npm-url]: https://artifactory.corp.adobe.com/artifactory/webapp/#/artifacts/browse/tree/General/npm-mcps-release-local/@reactor/extension-support-bridge/-/@reactor
[npm-image]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/badges/npm.svg
[npm-dependencies-url]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/dependencies.txt
[npm-dependencies-image]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/badges/dependencies.svg
