const filename = 'test/devtools-homepage-w-screenshots-trace.json'

var fs = require('fs')
var TraceToTimelineModel = require('.')

var events = fs.readFileSync(filename, 'utf8')
var model = new TraceToTimelineModel(events)

// console.log('Filmstrip model', model.filmStripModel)

// get screenshot
var frames = model.filmStripModel().frames()
var length = frames.length
if (length >= 1) {
  frames[length - 1].imageDataPromise()
    .then((data) => Promise.resolve('data:image/jpg;base64,' + data))
    .then((img) => {
      console.log(img)
    })
}
