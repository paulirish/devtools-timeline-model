import test from 'ava'

var fs = require('fs')
var traceToTimelineModel = require('../')

const filename = 'mdn-fling.json'
var events = fs.readFileSync(filename, 'utf8')
var model

test("doesn't throw an exception", t => {
  t.notThrows(_ => {
    model = traceToTimelineModel(events)
  })
})

test('metrics returned are expected', t => {
  t.is(model.timelineModel.mainThreadEvents().length, 4812)
  t.is(model.irModel.interactionRecords().length, 9)
  t.is(model.frameModel.frames().length, 125)
})

// test('bottom-up profile ', t => {
//   var topCosts = [...model.bottomUpGroupedSorted.children.values()];
//   var secondTopCost = topCosts[1];
//   t.is(true,true)
//   t.is(secondTopCost.totalTime.toFixed(2), '183.22');
//   t.is(secondTopCost.id, "https://developer.cdn.mozilla.net/static/build/js/main.4df460b33f9e.js")
// })

