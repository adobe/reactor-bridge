# @adobe/reactor-bridge

[![npm (scoped with tag)](https://img.shields.io/npm/v/@adobe/reactor-bridge.svg?style=flat)](https://www.npmjs.com/package/@adobe/reactor-bridge)

This project provides a communication layer between the Launch UI (Lens) and extension views. The layer contains three different parts:

* **Parent (lib/parent.js):** This is the portion of the communication layer that Lens uses. Lens uses this by importing it directly:

  `import { loadIframe } from '@adobe/reactor-bridge';`

* **Child (dist/extensionbridge-child.js):** This is the portion of the communication layer that extension views use, though extension views don't load it directly (see Child Loader). This is hosted by the DTM UI which means it may be different based on the environment. This is important since it needs to be compatible with the Parent that is being used by the DTM UI in the same environment.
* **Child Loader (dist/extensionbridge.js):** This loads Child. Child Loader will be loaded by extensions via a `script` tag. Extensions will always load the same Child Loader regardless of the environment they are running in. Child Loader then loads the environment-specific Child.

For more information regarding Launch, please visit our [product website](http://www.adobe.com/enterprise/cloud-platform/launch.html).
