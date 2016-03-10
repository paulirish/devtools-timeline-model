/* global WebInspector Runtime */

require('./lib/api-stubs')

// Pull in the devtools frontend
require('chrome-devtools-frontend/front_end/common/Object.js')

//    We need to barely rewrite just one of these files.
//    Expose any function declarations as assignments to the global obj
//    FIXME: remove hack once https://codereview.chromium.org/1739473002/ has landed.
var hook = require('node-hook')
hook.hook('.js', source => source.replace(/\nfunction\s(\S+)\(/g, '\n$1 = function('))
require('chrome-devtools-frontend/front_end/platform/utilities.js')
hook.unhook('.js')

//    Pull in the rest, unmodified
require('chrome-devtools-frontend/front_end/sdk/Target.js')
require('chrome-devtools-frontend/front_end/bindings/TempFile.js')
require('chrome-devtools-frontend/front_end/sdk/TracingModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineJSProfile.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js')
require('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js')
require('chrome-devtools-frontend/front_end/timeline/LayerTreeModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js')
require('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineProfileTree.js')
require('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineIRModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineFrameModel.js')


require('./lib/devtools-init')
require('./lib/timeline-model-treeview')

function traceToTimelineModel (events) {

  // (devtools) tracing model
  var tracingModel = new WebInspector.TracingModel(new WebInspector.TempFileBackingStorage('tracing'))
  // timeline model
  var timelineModel = new WebInspector.TimelineModel(WebInspector.TimelineUIUtils.visibleEventsFilter())

  // populate with events
  tracingModel.reset()
  tracingModel.addEvents(typeof events === 'string' ? JSON.parse(events) : events)
  tracingModel.tracingComplete()
  timelineModel.setEvents(tracingModel)

  // topdown / bottomup trees
  var groupingSetting = WebInspector.TimelineAggregator.GroupBy.None;
  var aggregator = new WebInspector.TimelineAggregator(event => WebInspector.TimelineUIUtils.eventStyle(event).category.name);
  var topDown = WebInspector.TimelineProfileTree.buildTopDown(timelineModel.mainThreadEvents(), /*filters*/ [], /*startTime*/ 0, /*endTime*/ Infinity, /*eventIdCallback*/ undefined);
  var topDownExport = Object.assign({}, topDown);

  // bottomup & grouped trees
  var bottomUp = WebInspector.TimelineProfileTree.buildBottomUp(topDown, aggregator.groupFunction(groupingSetting));
  groupingSetting = WebInspector.TimelineAggregator.GroupBy.URL; // one of: None Category Subdomain Domain URL
  var bottomUpExport = Object.assign({}, bottomUp);
  var topDownGrouped =  aggregator.performGrouping(topDown, groupingSetting);
  var bottomUpGrouped =  aggregator.performGrouping(bottomUp, groupingSetting)

  // tree views
  // new TimelineModelTreeView(topDownGrouped).sortingChanged('total', 'asc');
  new TimelineModelTreeView(bottomUpGrouped).sortingChanged('self', 'desc');

  // frame model
  var frameModel = new WebInspector.TracingTimelineFrameModel()
  frameModel.addTraceEvents({ /* target */ }, timelineModel.inspectedTargetEvents(), timelineModel.sessionId() || '')

  // filmstrip model
  var filmStripModel = new WebInspector.FilmStripModel(tracingModel)

  // interaction model
  var irModel = new WebInspector.TimelineIRModel()
  irModel.populate(timelineModel)

  return {
    tracingModel: tracingModel,
    timelineModel: timelineModel,
    irModel: irModel,
    frameModel: frameModel,
    filmStripModel: filmStripModel,
    topDown: topDownExport,
    bottomUp: bottomUpExport,
    topDownGroupedUnsorted: topDownGrouped, // Not matching what DevTools UI provides, currently
    bottomUpGroupedSorted: bottomUpGrouped
  }
}

module.exports = traceToTimelineModel
