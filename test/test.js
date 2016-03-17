import test from 'ava'

var fs = require('fs')
var TraceToTimelineModel = require('../')

const filename = 'devtools-homepage-w-screenshots-trace.json'
var events = fs.readFileSync(filename, 'utf8')
var model

test("doesn't throw an exception", (t) => {
  t.notThrows((_) => {
    model = new TraceToTimelineModel(events)
  })
})

test('metrics returned are expected', (t) => {
  t.is(model.timelineModel().mainThreadEvents().length, 7228)
  t.is(model.interactionModel().interactionRecords().length, 0)
  t.is(model.frameModel().frames().length, 16)
})

test('top-down profile', (t) => {
  var leaves = [...model.topDown().children.entries()].length;
  t.is(leaves, 28)
  var time = model.topDown().totalTime.toFixed(2)
  t.is(time, '559.21')
})


test('bottom-up profile', (t) => {
  var leaves = [...model.bottomUp().children.entries()].length
  t.is(leaves, 243)
  var topCosts = [...model.bottomUpGroupBy('URL').children.values()]
  var time = topCosts[1].totalTime.toFixed(2)
  var url = topCosts[1].id
  t.is(time, '80.77')
  t.is(url, 'https://s.ytimg.com/yts/jsbin/www-embed-lightweight-vflu_2b1k/www-embed-lightweight.js')
})
