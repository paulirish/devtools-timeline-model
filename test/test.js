'use strict';

var fs = require('fs');
const assert = require('assert');

var TimelineModel = require('../');

const traceInArrayFormatFilename = './test/assets/devtools-homepage-w-screenshots-trace.json';
const traceInObjectFormatFilename = './test/assets/trace-in-object-format.json';
var events = fs.readFileSync(traceInArrayFormatFilename, 'utf8');
var model;

/* global describe, it */
describe('Web Inspector obj', function() {
  // tested over in lighthouse but this isn't available in the sandbox
  it.skip('WebInspector exported is the real one', () => {
    const WebInspector = TimelineModel.sandbox.WI;
    assert.equal(typeof WebInspector, 'object');
    assert.ok(WebInspector.TimelineModel);
    assert.ok(WebInspector.TimelineUIUtils);
    assert.ok(WebInspector.FilmStripModel);
    assert.ok(WebInspector.TimelineProfileTree);
    assert.ok(WebInspector.TimelineAggregator);
    assert.ok(WebInspector.NetworkManager);
    assert.ok(WebInspector.Color);
  });

  it('Array native globals dont leak', () => {
    assert.equal(Array.prototype.peekLast, undefined);
  });

  it('WebInspector global doesn\'t leak', () => {
    assert.equal('WebInspector' in global, false);
    assert.equal('Runtime' in global, false);
    assert.equal('TreeElement' in global, false);
    assert.equal('WorkerRuntime' in global, false);
    assert.equal('Protocol' in global, false);
  });
});


describe('DevTools Timeline Model', function() {
  it('doesn\'t throw an exception', () => {
    assert.doesNotThrow(_ => {
      model = new TimelineModel(events);
    });
  });

  it('Multiple instances don\'t conflict', () => {
    let model1;
    let model2;
    assert.doesNotThrow(_ => {
      model1 = new TimelineModel(events);
      model2 = new TimelineModel(events);
    });
    const events1 = model1.timelineModel().mainThreadEvents().length;
    const events2 = model2.timelineModel().mainThreadEvents().length;
    assert.equal(events1, events2);
  });

  it('metrics returned are expected', () => {
    assert.equal(model.timelineModel().mainThreadEvents().length, 7721);
    assert.equal(model.interactionModel().interactionRecords().length, 0);
    assert.equal(model.frameModel().frames().length, 16);
  });

  it('top-down profile', () => {
    const leavesCount = model.topDown().children.size;
    console.log([...model.topDown().children.values()].map(e => [e.id, e.totalTime]));
    assert.equal(leavesCount, 27);
    const time = model.topDown().totalTime.toFixed(2);
    assert.equal(time, '555.01');
  });

  it('bottom-up profile', () => {
    const leavesCount = model.bottomUp().children.size;
    assert.equal(leavesCount, 220);
    const topCosts = [...model.bottomUpGroupBy('URL').children.values()];
    const time = topCosts[1].totalTime.toFixed(2);
    const url = topCosts[1].id;
    assert.equal(time, '76.26');
    assert.equal(url, 'https://s.ytimg.com/yts/jsbin/www-embed-lightweight-vflu_2b1k/www-embed-lightweight.js');
  });

  it('bottom-up profile - group by eventname', () => {
    const bottomUpByName = model.bottomUpGroupBy('EventName');
    const leavesCount = bottomUpByName.children.size;
    assert.equal(leavesCount, 13);
    const topCosts = [...bottomUpByName.children.values()];
    const time = topCosts[0].selfTime.toFixed(2);
    const name = topCosts[0].id;
    assert.equal(time, '187.75');
    assert.equal(name, 'Layout');
  });

  it('bottom-up profile - group by subdomain', () => {
    const bottomUpByName = model.bottomUpGroupBy('Subdomain');
    const topCosts = [...bottomUpByName.children.values()];
    const time = topCosts[2].selfTime.toFixed(2);
    const name = topCosts[2].id;
    assert.equal(time, '44.33');
    assert.equal(name, 'developers.google.com');
  });
});

// ideas for tests
// bottom up tree returns in self desc order
// top down tree returns in total desc order
// no entry in trees with empty ID


// https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#heading=h.q8di1j2nawlp
describe('Supports Trace Events in JSON Object format', function() {
  const events = fs.readFileSync(traceInObjectFormatFilename, 'utf8');
  let model;

  it('does not throw an exception', () => {
    assert.doesNotThrow(_ => {
      model = new TimelineModel(events);
    });
  });

  it('creates correctly formatted model', () => {
    assert.equal(model.timelineModel().mainThreadEvents().length, 8254);
    assert.equal(model.interactionModel().interactionRecords().length, 0);
    assert.equal(model.frameModel().frames().length, 12);
  });
});

