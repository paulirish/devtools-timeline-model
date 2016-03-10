const filenames = [
  'test/mdn-fling.json',
  'test/devtools-homepage-w-screenshots-trace.json'
]

var fs = require('fs')
var traceToTimelineModel = require('.')

if (!console.group) {
  console.group = (n) => console.log(n, ':');
  console.groupEnd = (n) => console.log('');
}

function report (filename) {
  var events = fs.readFileSync(filename, 'utf8')

  var model = traceToTimelineModel(events)

  console.group(filename);

  console.log('Timeline model events:\n', model.timelineModel.mainThreadEvents().length)
  console.log('IR model interactions\n', model.irModel.interactionRecords().length)
  console.log('Frame model frames:\n', model.frameModel.frames().length)
  console.log('Filmstrip model screenshots:\n', model.filmStripModel.frames().length)


  console.log('Top down tree total time:\n', model.topDown.totalTime)
  console.log('Bottom up tree:\n', model.bottomUp)
  // console.log('Top down tree, grouped by URL:\n', model.topDownGrouped)
  var topCost = model.bottomUpGrouped.children.entries().next().value[1]
  console.log('Bottom up tree, grouped, top URL:\n', topCost.id, topCost.totalTime)

  // console.log('Tracing model:\n', model.tracingModel)
  // console.log('Timeline model:\n', model.timelineModel)
  // console.log('IR model:\n', model.irModel)
  // console.log('Frame model:\n', model.frameModel)
  // console.log('Filmstrip model:\n', model.filmStripModel)

  // console.log('Top down tree:\n', model.topDown)
  // console.log('Bottom up tree:\n', model.bottomUp)
  // //console.log('Top down tree, grouped by URL:\n', model.topDownGrouped)
  // console.log('Bottom up tree grouped by URL:\n', model.bottomUpGrouped)


  console.groupEnd(filename);
}

filenames.forEach(report)
