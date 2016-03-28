
const TraceToTimelineModel = require('.')

var events = require('fs').readFileSync('test/devtools-homepage-w-screenshots-trace.json', 'utf8')

var model = new TraceToTimelineModel(events)

var bottomUpByName = model.bottomUpGroupBy('EventName')

var result = new Map()
bottomUpByName.children.forEach(function(value, key) {
  result.set(key, value.selfTime);
})
console.log('Bottom up tree grouped by Name:\n', result)


