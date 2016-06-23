'use strict';

const fs = require('fs');
const resolve = require('resolve');

// In order to maintain consistent global scope across the files,
// and share natives like Array, etc, We will eval things within our sandbox
/* eslint-disable no-eval */
function requireval(path) {
  var res = resolve.sync(path, {basedir: __dirname});
  var filesrc = fs.readFileSync(res, 'utf8');
  eval(filesrc + '\n\n//# sourceURL=' + path);
}
/* eslint-enable no-eval */

// establish our sandboxed globals
this.window = this.self = this.global = this;
this.console = console;

/* global WebInspector */
this.WebInspector = {};
this.Runtime = this.TreeElement = {};
this.WorkerRuntime = this.Protocol = {};

// polyfills
requireval('./lib/api-stubs.js');

// chrome devtools frontend
requireval('chrome-devtools-frontend/front_end/common/Object.js');
requireval('chrome-devtools-frontend/front_end/platform/utilities.js');
requireval('chrome-devtools-frontend/front_end/common/ParsedURL.js');
requireval('chrome-devtools-frontend/front_end/sdk/Target.js');
requireval('chrome-devtools-frontend/front_end/common/SegmentedRange.js');
requireval('chrome-devtools-frontend/front_end/bindings/TempFile.js');
requireval('chrome-devtools-frontend/front_end/sdk/TracingModel.js');
requireval('chrome-devtools-frontend/front_end/sdk/ProfileTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineJSProfile.js');
requireval('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/LayerTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineModel.js');
requireval('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js');
requireval('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineProfileTree.js');
requireval('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineIRModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineFrameModel.js');

// minor configurations
requireval('./lib/devtools-monkeypatches.js');
// polyfill the bottom-up and topdown tree sorting
const TimelineModelTreeView = require('./lib/timeline-model-treeview.js')(WebInspector);

class SandboxedModel {

  constructor() {
    this.WI = WebInspector;
  }

  init(events) {
    // (devtools) tracing model
    this._tracingModel = new WebInspector.TracingModel(new WebInspector.TempFileBackingStorage('tracing'));
    // timeline model
    this._timelineModel = new WebInspector.TimelineModel(WebInspector.TimelineUIUtils.visibleEventsFilter());

    if (typeof events === 'string') events = JSON.parse(events);
    // WebPagetest trace files put events in object under key `traceEvents`
    if (events.hasOwnProperty('traceEvents')) events = events.traceEvents;

    // populate with events
    this._tracingModel.reset();
    this._tracingModel.addEvents(events);
    this._tracingModel.tracingComplete();
    this._timelineModel.setEvents(this._tracingModel);

    return this;
  }

  _createAggregator() {
    return WebInspector.AggregatedTimelineTreeView.prototype._createAggregator();
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

    var topDown = WebInspector.TimelineProfileTree.buildTopDown(this._timelineModel.mainThreadEvents(),
      filters, /* startTime */ 0, /* endTime */ Infinity, WebInspector.TimelineAggregator.eventId);
    return topDown;
  }

  bottomUp() {
    var topDown = this.topDown();
    var noGrouping = WebInspector.TimelineAggregator.GroupBy.None;
    var noGroupAggregator = this._createAggregator().groupFunction(noGrouping);
    return WebInspector.TimelineProfileTree.buildBottomUp(topDown, noGroupAggregator);
  }

 /**
  * @param  {!string} grouping Allowed values: None Category Subdomain Domain URL EventName
  * @return {!WebInspector.TimelineProfileTree.Node} A grouped and sorted tree
  */
  bottomUpGroupBy(grouping) {
    var topDown = this.topDown();

    var groupSetting = WebInspector.TimelineAggregator.GroupBy[grouping];
    var groupingAggregator = this._createAggregator().groupFunction(groupSetting);
    var bottomUpGrouped = WebInspector.TimelineProfileTree.buildBottomUp(topDown, groupingAggregator);

    // sort the grouped tree, in-place
    new TimelineModelTreeView(bottomUpGrouped).sortingChanged('self', 'desc');
    return bottomUpGrouped;
  }

  frameModel() {
    var frameModel = new WebInspector.TimelineFrameModel(event =>
      WebInspector.TimelineUIUtils.eventStyle(event).category.name
    );
    frameModel.addTraceEvents({ /* target */ },
      this._timelineModel.inspectedTargetEvents(), this._timelineModel.sessionId() || '');
    return frameModel;
  }

  filmStripModel() {
    return new WebInspector.FilmStripModel(this._tracingModel);
  }

  interactionModel() {
    var irModel = new WebInspector.TimelineIRModel();
    irModel.populate(this._timelineModel);
    return irModel;
  }

}

var sandboxedModel = new SandboxedModel();
// return instance;
// var filesrc = fs.readFileSync(__dirname + "/../test/devtools-homepage-w-screenshots-trace.json", 'utf8');
// instance.init(filesrc)

// no exports as we're a sandboxed module.
