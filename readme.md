# devtools-timeline-model [![Build Status](https://travis-ci.org/paulirish/devtools-timeline-model.svg?branch=master)](https://travis-ci.org/paulirish/devtools-timeline-model)


> Parse raw trace data into the Chrome DevTools' structured profiling data models

If you use something like [big-rig](https://github.com/googlechrome/big-rig) or [automated-chrome-profiling](https://github.com/paulirish/automated-chrome-profiling#timeline-recording) you may end up with raw trace data. It's pretty raw. This module will parse that stuff into something a bit more consumable, and should help you with higher level analysis.


## Install

```sh
$ npm install --save devtools-timeline-model
```
[![NPM devtools-timeline-model package](https://img.shields.io/npm/v/devtools-timeline-model.svg)](https://npmjs.org/package/devtools-timeline-model)

## Usage

```js
var filename = 'demo/mdn-fling.json'
var events = require('fs').readFileSync(filename, 'utf8')

var DevtoolsTimelineModel = require('devtools-timeline-model');
// events can be either a string of the trace data or the JSON.parse'd equivalent
var model = new DevtoolsTimelineModel(events)

// tracing model
model.tracingModel()
// timeline model, all events
model.timelineModel()
// interaction model, incl scroll, click, animations
model.interactionModel()
// frame model, incl frame durations
model.frameModel()
// filmstrip model, incl screenshots
model.filmStripModel()

// topdown tree
model.topDown()
// bottom up tree
model.bottomUp()
// bottom up tree, grouped by URL
model.bottomUpGroupBy('URL') // accepts: None Category Subdomain Domain URL EventName

// see example.js for API examples.
```

![image](https://cloud.githubusercontent.com/assets/39191/13832447/7b4dffde-eb99-11e5-8f7e-f1afcf999fd6.png)

These objects are huge. You'll want to explore them in a UI like [devtool](https://github.com/Jam3/devtool).
![image](https://cloud.githubusercontent.com/assets/39191/13832411/390270ec-eb99-11e5-8dc9-c647c1b62c9d.png)


## Dev

```sh
npm i
brew install entr
gls index.js lib/*.js | entr node example.js
```

## Sandboxing WebInspector for Node

Requiring the DevTools frontend looks rather straightforward at first. (`global.WebInspector = {}`, then start `require()`ing the files, in dependency order). However, there are two problems that crop up:

1. The frontend requires ~five globals and they currently must be added to the global context to work. 
2. `utilities.js` adds a number of methods to native object prototypes, such as Array, Object, and typed arrays.

`devtools-timeline-model` addresses that by sandboxing the WebInspector into it's own context. Here's how it works:

##### index.js
```js
// First, sandboxed contexts don't have any globals from node, so we whitelist a few we'll provide for it.
var glob = { require: require, global: global, console: console, process, process, __dirname: __dirname }
// We read in our script to run, and create a vm.Script object 
var script  = new vm.Script(fs.readFileSync(__dirname + "/lib/timeline-model.js", 'utf8'))
// We create a new V8 context with our globals
var ctx = vm.createContext(glob)
// We evaluate the `vm.Script` in the new context
var output = script.runInContext(ctx)
```
##### (sandboxed) timeline-model.js
```js
// establish our sandboxed globals
this.window = this.self = this.global = this

// We locally eval, as the node module scope isn't appropriate for the browser-centric DevTools frontend
function requireval(path){
  var filesrc = fs.readFileSync(__dirname + '/node_modules/' + path, 'utf8');
  eval(filesrc + '\n\n//# sourceURL=' + path);
}

// polyfills, then the real chrome devtools frontend
requireval('../lib/api-stubs.js')
requireval('chrome-devtools-frontend/front_end/common/Object.js')
requireval('chrome-devtools-frontend/front_end/common/SegmentedRange.js')
requireval('chrome-devtools-frontend/front_end/platform/utilities.js')
requireval('chrome-devtools-frontend/front_end/sdk/Target.js')
// ...
```
##### index.js
```
// After that's all done, we pull the local `instance` variable out, to use as our proxy object
this.sandbox = ctx.instance;
```

Debugging is harder, as most tools aren't used to this setup. While `devtool` doesn't work well, you can have it run `lib/devtools-timeline-model.js` directly, which is fairly succesful. The classic `node-inspector` does work pretty well with the sandboxed script, though the workflow is a little worse than `devtool`'s. 



## License

Apache © [Paul Irish](https://github.com/paulirish/)
