# Crowdmark Addons

Crowdmark Addons is a Greasemonkey script to add administrative 
features to the Crowdmark website.

# Installation

In Firefox, install the [Greasemonkey](https://addons.mozilla.org/en-CA/firefox/addon/greasemonkey/) extension. 
Then click [here](https://github.com/siefkenj/crowdmark-addons/raw/master/dist/crowdmark-addons.user.js)
and an install dialog should appear.

# Development

*Crowdmark Addons* is developed with React, which involves compiling javascript code. Because
Greasemonkey doesn't normally have access to the file system, devloping *Crowdmark Addons* involves
using a special development version of *Crowdmark Addons*.

## Building

To build *Crowdmark Addons* you must have [Node.js](https://nodejs.org/en/download/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
Then,

```
cd app/
npm install
npm run build
```

When the build script completes, you should have a fresh version of *Crodmark Addons* located at `dist/crowdmark-addons.user.js`
(in the top-level `dist/` directory).

## Development and Dynamic Loading

When developing, it's nice to be able to get the newest version of your script upon a page
refresh. To do this, install the development version of *Crowdmark Addons* script located
`dist/crowdmark-addons-dev.user.js` or click [here](https://github.com/siefkenj/crowdmark-addons/raw/master/dist/crowdmark-addons-dev.user.js).
The dev script will dynamically load the extension from port `8123`.

Now, run

```
cd app/
npm install    # if you haven't already
npm start
```

and a development server should start running on `localhost:8123`. Changing any files in `app/src` will trigger
and automatic recompile which will be served to the dev addon on the next page reload.
