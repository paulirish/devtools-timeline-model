import test from 'ava';

var fs = require('fs')
var traceToTimelineModel = require('../')

const filename = 'mdn-fling.json'
var events = fs.readFileSync(filename, 'utf8')
var model

test("doesn't throw an exception", t => {
	t.notThrows(_ => {
		model = traceToTimelineModel(events)
	});
});

test("metrics returned are expected", t => {
	t.is(model.timelineModel.mainThreadEvents().length, 4783);
	t.is(model.irModel.interactionRecords().length, 9);
	t.is(model.frameModel.frames().length, 125);
});
