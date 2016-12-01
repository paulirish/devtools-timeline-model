const filenames = [
  'test/assets/mdn-fling.json',
  'test/assets/devtools-homepage-w-screenshots-trace.json'
];

const TimelineModel = {
  TimelineModel: {
    RecordType: {JSFrame: 'JSFrame'}
  }
};

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

function dumpTree(tree, timeValue) {
  var maxEntries = 15;
  var count = 0;
  var result = new Map();
  tree.children.forEach((value, key) => {
    if (++count >= maxEntries) {
      result.set('other items', `${tree.children.size} total items. truncated to 15 here.`)
      return;
    }
    result.set(value.readableName || key, value[timeValue].toFixed(1));
  });
  return result;
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

  var topDown = model.topDown();
  console.log('Top down tree total time:\n', topDown.totalTime);
  console.log('Top down tree, not grouped:\n', dumpTree(topDown, 'totalTime'));

  console.log('Bottom up tree leaves:\n', [...model.bottomUp().children.entries()].length);
  var bottomUpURL = model.bottomUpGroupBy('URL');
  var secondTopCost = [...bottomUpURL.children.values()][1];
  console.log('bottom up tree, grouped by URL', dumpTree(bottomUpURL, 'selfTime'));
  console.log('Bottom up tree, grouped, 2nd top URL:\n', secondTopCost.totalTime.toFixed(2), secondTopCost.id);

  var bottomUpSubdomain = model.bottomUpGroupBy('Subdomain');
  console.log('Bottom up tree, grouped by top subdomain:\n', dumpTree(bottomUpSubdomain, 'selfTime'));

  var bottomUpByName = model.bottomUpGroupBy('EventName');
  console.log('Bottom up tree grouped by EventName:\n', dumpTree(bottomUpByName, 'selfTime'));

  // console.log('Tracing model:\n', model.tracingModel())
  // console.log('Timeline model:\n', model.timelineModel())
  // console.log('IR model:\n', model.interactionModel())
  // console.log('Frame model:\n', model.frameModel())
  // console.log('Filmstrip model:\n', model.filmStripModel())

  // console.log('Top down tree:\n', model.topDown())
  // console.log('Bottom up tree:\n', model.bottomUp())
  // console.log('Top down tree, grouped by URL:\n', model.topDownGroupedUnsorted)
  // console.log('Bottom up tree grouped by URL:\n', model.bottomUpGroupBy('None'))
  console.groupEnd(filename);
}

function viewCallStatsReport() {
  var filename = 'test/assets/ember-webpack-todomvc.json';
  var events = fs.readFileSync(filename, 'utf8');

  var model = new TraceToTimelineModel(events);
  console.group(filename);

  var bottomUpCategory = model.bottomUpGroupBy('Category');
  console.log('Bottom up tree, grouped by category:\n', dumpTree(bottomUpCategory, 'selfTime'));

  var scriptingTasks = bottomUpCategory.children.get('scripting');
  console.log('Bottom up tree, grouped by category, viewing scripting items:\n', dumpTree(scriptingTasks, 'selfTime'));

  var result = new Map();
  scriptingTasks.children.forEach((value, key) => {
    if (value.event.name === TimelineModel.TimelineModel.RecordType.JSFrame)
      key = 'JS Execution';
    else
      key = value.readableName;

    var totalTime = result.get(key) || 0;
    totalTime += value.selfTime;
    result.set(key, totalTime);
  });

  result.forEach((value, key) => result.set(key, value.toFixed(1)));
  console.log(result);

    // if (node.event.name ) {
    //   readableName = 'adsfads'
    // } else

  console.groupEnd(filename);
}


// filenames.forEach(report);
viewCallStatsReport();
