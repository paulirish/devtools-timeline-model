"use strict"

const fs = require('fs')
const assert = require('assert');

const frame = require('speedline/lib/frame');
const speedIndex = require('speedline/lib/speed-index');

const tracefilename = './test/assets/devtools-homepage-w-screenshots-trace.json'
const tracejsonfilename = './test/assets/progressive-app.json'
const ssfilename = './test/assets/grayscale.jpg'

function calculateVisualProgressFromImages(images = [], delay = 1000) {
	const baseTs = new Date().getTime();

	const frames = images.map((imgPath, i) => {
		const imgBuff = fs.readFileSync(imgPath);
		return frame.create(imgBuff, baseTs + i * delay);
	});

	return speedIndex.calculateVisualProgress(frames);
};

describe('speedline compat', function() {
  it('extract frames from timeline should returns an array of frames', done => {
    frame.extractFramesFromTimeline(tracefilename).then(frames => {
      assert.ok(Array.isArray(frames), 'Frames is an array');
      done();
    });
  });

  it('extract frames should support json', done => {
    const trace = JSON.parse(fs.readFileSync(tracejsonfilename, 'utf-8'));
    const frames = frame.extractFramesFromTimeline(trace).then(frames => {
      assert.ok(Array.isArray(frames), 'Frames is an array');
      done();
    });
  });

  it('visual progress should be 100 if there is a single frame only', done => {
    const frames = calculateVisualProgressFromImages([ssfilename]);
    assert.equal(frames[0].getProgress(), 100);
    done();
  });
});
