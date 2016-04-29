var fs = require('fs')
const assert = require('assert');

var TraceToTimelineModel = require('../')

const filename = './test/assets/devtools-homepage-w-screenshots-trace.json'
var events = fs.readFileSync(filename, 'utf8')
var model

describe('timeline-model basics', _ => {
  it("doesn't throw an exception", _ => {
    assert.doesNotThrow(_ => {
      model = new TraceToTimelineModel(events)
    })
  })

  it("Array native globals dont leak", _ => {
    assert.equal(Array.prototype.peekLast, undefined)
  })

  it("WebInspector global doesn't leak", _ => {
    assert.equal(typeof WebInspector, 'undefined')
  })

  it("Multiple instances don't conflict", _ => {
    var model1, model2;
    assert.doesNotThrow(_ => {
      model1 = new TraceToTimelineModel(events)
      model2 = new TraceToTimelineModel(events)
    })
    var events1 = model1.timelineModel().mainThreadEvents().length;
    var events2 = model2.timelineModel().mainThreadEvents().length;
    assert.equal(events1, events2)
  })

  it('metrics returned are expected', _ => {
    assert.equal(model.timelineModel().mainThreadEvents().length, 7228)
    assert.equal(model.interactionModel().interactionRecords().length, 0)
    assert.equal(model.frameModel().frames().length, 16)
  })

  it('top-down profile', _ => {
    const leavesCount = model.topDown().children.size;
    assert.equal(leavesCount, 28)
    var time = model.topDown().totalTime.toFixed(2)
    assert.equal(time, '559.21')
  })


  it('bottom-up profile', _ => {
    const leavesCount = model.bottomUp().children.size;
    assert.equal(leaves, 243)
    var topCosts = [...model.bottomUpGroupBy('URL').children.values()]
    var time = topCosts[1].totalTime.toFixed(2)
    var url = topCosts[1].id
    assert.equal(time, '80.77')
    assert.equal(url, 'https://s.ytimg.com/yts/jsbin/www-embed-lightweight-vflu_2b1k/www-embed-lightweight.js')
  })

  it('bottom-up profile - group by eventname', _ => {
    const bottomUpByName = model.bottomUpGroupBy('EventName');
    const leavesCount = bottomUpByName.children.size;
    assert.equal(leavesCount, 15)
    const topCosts = [...bottomUpByName.children.values()];
    const time = topCosts[0].selfTime.toFixed(2);
    const name = topCosts[0].id;
    assert.equal(time, '187.75')
    assert.equal(name, 'Layout')
  })
});
