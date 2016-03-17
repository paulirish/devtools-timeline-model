# devtools-timeline-model [![Build Status](https://travis-ci.org/paulirish/devtools-timeline-model.svg?branch=master)](https://travis-ci.org/paulirish/devtools-timeline-model)


> Parse raw trace data into the Chrome DevTools' structured profiling data models

If you use something like [big-rig](https://github.com/googlechrome/big-rig) or [automated-chrome-profiling](https://github.com/paulirish/automated-chrome-profiling#timeline-recording) you may end up with raw trace data. It's pretty raw. This module will parse that stuff into something a bit more consumable, and should help you with higher level analysis.


## Install

```sh
$ npm install --save devtools-timeline-model
```
[![NPM devtools-timeline-model package](https://nodei.co/npm/devtools-timeline-model.png?compact=true)](https://npmjs.org/package/devtools-timeline-model)

## Usage

```js
var filename = 'demo/mdn-fling.json'
var events = require('fs').readFileSync(filename, 'utf8')

var devtoolsTimelineModel = require('devtools-timeline-model');
// events can be either a string of the trace data or the JSON.parse'd equivalent
var model = new devtoolsTimelineModel(events)


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
model.bottomUpGroupBy('URL')
```

![image](https://cloud.githubusercontent.com/assets/39191/13276174/6e8284e8-da71-11e5-89a1-190abbac8dfd.png)

These objects are huge. You'll want to explore them in a UI like [devtool](https://github.com/Jam3/devtool).
![image](https://cloud.githubusercontent.com/assets/39191/13277814/7b6ca6b6-da80-11e5-8841-71305ade04b4.png)





## License

Apache © [Paul Irish](https://github.com/paulirish/)
