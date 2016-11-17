# extension-support-bridge
[![Build Status][status-image]][status-url] [![NPM version][npm-image]][npm-url] [![NPM Dependencies][npm-dependencies-image]][npm-dependencies-url]

This project is a communication layer between Lens and extension views. The layer contains three different parts:

* **Parent (lib/parent.js):** This is the portion of the communication layer that Lens uses. Lens uses this by importing it directly:

  `import { loadIframe } from '@reactor/extension-support-bridge';`

* **Child (dist/extensionbridge-child.js):** This is the portion of the communication layer that extension views use, though extension views don't load it directly (see Child Loader). This is hosted by Lens which means it may be different based on the environment. This is important since it needs to be compatible with the Parent that is being used by Lens in the same environment.
* **Child Loader (dist/extensionbridge.js):** This loads Child. Child Loader will be loaded by extensions via a `script` tag. Extensions will always load the same Child Loader regardless of the environment they are running in. Child Loader then loads the environment-specific Child.

[status-url]: https://dtm-builder.ut1.mcps.adobe.net/job/extension-support-bridge
[status-image]: https://dtm-builder.ut1.mcps.adobe.net/buildStatus/icon?job=extension-support-bridge
[npm-url]: https://artifactory.corp.adobe.com/artifactory/webapp/#/artifacts/browse/tree/General/npm-mcps-release-local/@reactor/extension-support-bridge/-/@reactor
[npm-image]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/badges/npm.svg
[npm-dependencies-url]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/dependencies.txt
[npm-dependencies-image]: https://dtm-builder.ut1.mcps.adobe.net/view/Reactor-Frontend/job/extension-support-bridge/ws/badges/dependencies.svg
