const filenames = [
  'test/assets/mdn-fling.json',
  'test/assets/devtools-homepage-w-screenshots-trace.json'
];

var fs = require('fs');
var TraceToTimelineModel = require('.');

if (!console.group) {
  console.group = n => console.log(n, ':');
  console.groupEnd = _ => console.log('');
}

function dumpScreenshot(filmStripModel) {
  var frames = filmStripModel.frames();
  var framesLen = frames.length;
  if (framesLen >= 1) {
    frames[framesLen - 1].imageDataPromise()
      .then(data => Promise.resolve('data:image/jpg;base64,' + data))
      .then(img => {
        console.log('Filmstrip model last screenshot:\n', img.substr(0, 50) + '...');
      });
  }
}

function report(filename) {
  var events = fs.readFileSync(filename, 'utf8');

  var model = new TraceToTimelineModel(events);

  console.group(filename);

  console.log('Timeline model events:\n', model.timelineModel().mainThreadEvents().length);
  console.log('IR model interactions\n', model.interactionModel().interactionRecords().length);
  console.log('Frame model frames:\n', model.frameModel().frames().length);
  console.log('Filmstrip model screenshots:\n', model.filmStripModel().frames().length);
  dumpScreenshot(model.filmStripModel());

  console.log('Top down tree total time:\n', model.topDown().totalTime);
  console.log('Bottom up tree leaves:\n', [...model.bottomUp().children.entries()].length);
  // console.log('Top down tree, grouped by URL:\n', model.topDownGroupedUnsorted)
  var topCosts = [...model.bottomUpGroupBy('URL').children.values()];
  var secondTopCost = topCosts[1];
  console.log('Bottom up tree, grouped, 2nd top URL:\n', secondTopCost.totalTime.toFixed(2), secondTopCost.id);

  var topCostsByDomain = [...model.bottomUpGroupBy('Subdomain').children.values()];
  var thirdTopDomainCost = topCostsByDomain[2];
  console.log('Bottom up tree, grouped, 3rd top subdomain:\n', thirdTopDomainCost.totalTime.toFixed(2), thirdTopDomainCost.id);


  // console.log('Tracing model:\n', model.tracingModel())
  // console.log('Timeline model:\n', model.timelineModel())
  // console.log('IR model:\n', model.interactionModel())
  // console.log('Frame model:\n', model.frameModel())
  // console.log('Filmstrip model:\n', model.filmStripModel())

  // console.log('Top down tree:\n', model.topDown())
  // console.log('Bottom up tree:\n', model.bottomUp())
  // // console.log('Top down tree, grouped by URL:\n', model.topDownGroupedUnsorted)
  // console.log('Bottom up tree grouped by URL:\n', model.bottomUpGroupBy('None'))

  var bottomUpByName = model.bottomUpGroupBy('EventName');
  var result = new Map();
  bottomUpByName.children.forEach(function(value, key) {
    result.set(key, value.selfTime);
  });
  console.log('Bottom up tree grouped by EventName:\n', result);

  console.groupEnd(filename);
}

filenames.forEach(report);
