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

![image](https://cloud.githubusercontent.com/assets/39191/13832447/7b4dffde-eb99-11e5-8f7e-f1afcf999fd6.png)

These objects are huge. You'll want to explore them in a UI like [devtool](https://github.com/Jam3/devtool).
![image](https://cloud.githubusercontent.com/assets/39191/13832411/390270ec-eb99-11e5-8dc9-c647c1b62c9d.png)






## License

Apache © [Paul Irish](https://github.com/paulirish/)
