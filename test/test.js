import test from 'ava'

var fs = require('fs')
var TraceToTimelineModel = require('../')

const filename = 'assets/devtools-homepage-w-screenshots-trace.json'
var events = fs.readFileSync(filename, 'utf8')
var model

test("doesn't throw an exception", (t) => {
  t.notThrows((_) => {
    model = new TraceToTimelineModel(events)
  })
})

test("Array native globals dont leak", (t) => {
  t.is(Array.prototype.peekLast, undefined)
})

test("WebInspector global doesn't leak", (t) => {
  t.is(typeof WebInspector, 'undefined')
})

test("Multiple instances don't conflict", (t) => {
  var model1, model2;
  t.notThrows((_) => {
    model1 = new TraceToTimelineModel(events)
    model2 = new TraceToTimelineModel(events)
  })
  var events1 = model1.timelineModel().mainThreadEvents().length;
  var events2 = model2.timelineModel().mainThreadEvents().length;
  t.is(events1, events2)
})

test('metrics returned are expected', (t) => {
  t.is(model.timelineModel().mainThreadEvents().length, 7228)
  t.is(model.interactionModel().interactionRecords().length, 0)
  t.is(model.frameModel().frames().length, 16)
})

test('top-down profile', (t) => {
  const leavesCount = model.topDown().children.size;
  t.is(leavesCount, 28)
  var time = model.topDown().totalTime.toFixed(2)
  t.is(time, '559.21')
})


test('bottom-up profile', (t) => {
  const leavesCount = model.bottomUp().children.size;
  t.is(leaves, 243)
  var topCosts = [...model.bottomUpGroupBy('URL').children.values()]
  var time = topCosts[1].totalTime.toFixed(2)
  var url = topCosts[1].id
  t.is(time, '80.77')
  t.is(url, 'https://s.ytimg.com/yts/jsbin/www-embed-lightweight-vflu_2b1k/www-embed-lightweight.js')
})

test('bottom-up profile - group by eventname', (t) => {
  const bottomUpByName = model.bottomUpGroupBy('EventName');
  const leavesCount = bottomUpByName.children.size;
  t.is(leavesCount, 15)
  const topCosts = [...bottomUpByName.children.values()];
  const time = topCosts[0].selfTime.toFixed(2);
  const name = topCosts[0].id;
  t.is(time, '187.75')
  t.is(name, 'Layout')
})
