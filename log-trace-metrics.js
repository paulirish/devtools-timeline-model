const filenames = [
  'test/mdn-fling.json',
  'test/devtools-homepage-w-screenshots-trace.json'
]

var fs = require('fs')
var traceToTimelineModel = require('.')

function report (filename) {
  var events = fs.readFileSync(filename, 'utf8')
  var model = traceToTimelineModel(events)

  console.log('\n', filename, ':')
  console.log('Timeline model events:', model.timelineModel.mainThreadEvents().length)
  console.log('IR model interactions', model.irModel.interactionRecords().length)
  console.log('Frame model frames', model.frameModel.frames().length)
  console.log('Filmstrip model screenshots:', model.filmStripModel.frames().length)

  // console.log('Tracing model:', model.timelineModel._tracingModel)
  // console.log('Timeline model:', model.timelineModel)
  // console.log('IR model', model.irModel)
  // console.log('Frame model', model.frameModel)
  // console.log('Filmstrip model', model.filmStripModel)
}

filenames.forEach(report)
