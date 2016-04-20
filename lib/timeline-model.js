'use strict'

const fs = require('fs');
const path = require('path');
const resolve = require('resolve');

// In order to maintain consistent global scope across the files,
// and share natives like Array, etc, We will eval things within
// our sandbox
function requireval(path){
  var res = resolve.sync(path, { basedir: __dirname })
  var filesrc = fs.readFileSync(res, 'utf8');
  eval(filesrc + '\n\n//# sourceURL=' + path);
}


// establish our sandboxed globals
this.window = this.self = this.global = this
this.console = console

this.WebInspector = {}
this.Runtime = this.TreeElement = {}
this.WorkerRuntime = this.Protocol = {}

// polyfills
requireval('./lib/api-stubs.js')

// chrome devtools frontend
requireval('chrome-devtools-frontend/front_end/common/Object.js')
requireval('chrome-devtools-frontend/front_end/common/SegmentedRange.js')
requireval('chrome-devtools-frontend/front_end/platform/utilities.js')
requireval('chrome-devtools-frontend/front_end/sdk/Target.js')
requireval('chrome-devtools-frontend/front_end/bindings/TempFile.js')
requireval('chrome-devtools-frontend/front_end/sdk/TracingModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineJSProfile.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js')
requireval('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/LayerTreeModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js')
requireval('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineProfileTree.js')
requireval('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineIRModel.js')
requireval('chrome-devtools-frontend/front_end/timeline/TimelineFrameModel.js')

// minor configurations
requireval('./lib/devtools-monkeypatches.js')
// polyfill the bottom-up and topdown tree sorting
const TreeView = require('./lib/timeline-model-treeview.js')(WebInspector)

class SandboxedModel {

  constructor() {
    this.WI = WebInspector;
  }

  init(events) {
    // (devtools) tracing model
    this._tracingModel = new WebInspector.TracingModel(new WebInspector.TempFileBackingStorage('tracing'))
    // timeline model
    this._timelineModel = new WebInspector.TimelineModel(WebInspector.TimelineUIUtils.visibleEventsFilter())

    // populate with events
    this._tracingModel.reset()
    this._tracingModel.addEvents(typeof events === 'string' ? JSON.parse(events) : events)
    this._tracingModel.tracingComplete()
    this._timelineModel.setEvents(this._tracingModel)

    this._aggregator = new WebInspector.TimelineAggregator((event) => WebInspector.TimelineUIUtils.eventStyle(event).category.name)

    return this;
  }

  timelineModel() {
    return this._timelineModel;
  }

  tracingModel() {
    return this._tracingModel;
  }

  topDown() {
    var filters = [];
    filters.push(WebInspector.TimelineUIUtils.visibleEventsFilter());
    filters.push(new WebInspector.ExcludeTopLevelFilter());
    var nonessentialEvents = [
      WebInspector.TimelineModel.RecordType.EventDispatch,
      WebInspector.TimelineModel.RecordType.FunctionCall,
      WebInspector.TimelineModel.RecordType.TimerFire
    ];
    filters.push(new WebInspector.ExclusiveNameFilter(nonessentialEvents));

    return WebInspector.TimelineProfileTree.buildTopDown(this._timelineModel.mainThreadEvents(),
                  filters, /* startTime */ 0, /* endTime */ Infinity, WebInspector.TimelineAggregator.eventId)
  }

  bottomUp() {
    var topDown = this.topDown();
    var noGrouping = WebInspector.TimelineAggregator.GroupBy.None
    var noGroupAggregator =  this._aggregator.groupFunction(noGrouping)
    return WebInspector.TimelineProfileTree.buildBottomUp(topDown, noGroupAggregator)
  }

  // @ returns a grouped and sorted tree
  bottomUpGroupBy(grouping) {
    var topDown = this.topDown();
    var groupSetting = WebInspector.TimelineAggregator.GroupBy[grouping] // one of: None Category Subdomain Domain URL
    var groupingAggregator =  this._aggregator.groupFunction(groupSetting)
    var bottomUpGrouped = WebInspector.TimelineProfileTree.buildBottomUp(topDown, groupingAggregator)
    // sort the grouped tree, in-place
    new TreeView(bottomUpGrouped).sortingChanged('self', 'desc')
    return bottomUpGrouped
  }

  frameModel() {
    var frameModel = new WebInspector.TracingTimelineFrameModel()
    frameModel.addTraceEvents({ /* target */ }, this._timelineModel.inspectedTargetEvents(), this._timelineModel.sessionId() || '')
    return frameModel
  }

  filmStripModel() {
    return new WebInspector.FilmStripModel(this._tracingModel)
  }


  interactionModel() {
    var irModel = new WebInspector.TimelineIRModel()
    irModel.populate(this._timelineModel)
    return irModel
  }

}

var instance = new SandboxedModel();
// var filesrc = fs.readFileSync(__dirname + "/../test/devtools-homepage-w-screenshots-trace.json", 'utf8');
// instance.init(filesrc)

// no exports as we're a sandboxed module.
