/* global WebInspector Runtime WorkerRuntime Protocol */

"use strict"

var noop = function () {}

var _WebInspector = global.WebInspector = {};
console.log('sup',process.pid);
// Required for a select portion DevTools frontend to work (in node)
global.self = global
global.window = global

global.Runtime = {}
global.TreeElement = {}
global.WorkerRuntime = {}
global.Protocol = {}

WebInspector.targetManager = {}
WebInspector.targetManager.observeTargets = noop
WebInspector.settings = {}
WebInspector.settings.createSetting = noop
WebInspector.console = {}
WebInspector.console.error = noop
WebInspector.moduleSetting = function () { return { get: noop } }
WebInspector.DeferredLayerTree = {}
WebInspector.VBox = noop
WebInspector.HBox = noop
WebInspector.ViewportDataGrid = noop
WebInspector.ViewportDataGridNode = noop
WebInspector.SortableDataGridNode = {}
WebInspector.UIString = (str) => str
Protocol.Agents = {}
Runtime.experiments = {}
WorkerRuntime.Worker = noop
WebInspector.TimelineTreeView = {}


require('chrome-devtools-frontend/front_end/common/Object.js')
require('chrome-devtools-frontend/front_end/common/SegmentedRange.js')
require('chrome-devtools-frontend/front_end/platform/utilities.js')
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

// minor configurations
require('./devtools-init')
// polyfill the bottom-up and topdown tree sorting
require('./timeline-model-treeview')

if (!Array.prototype.FANCY) {
  Array.prototype.FANCY = function(fn, ctx) {

    if (this === void 0 || this === null || typeof fn !== "function") throw new TypeError

    var t = Object(this),
        len = t.length >>> 0,
        noCtx = (ctx === void 0 || ctx === null)

    for (var i = 0; i < len; i++) {
      if (i in t) {
        if (noCtx) {
          if (!fn(t[i], i, t)) return false
        } else {
          if (!fn.call(ctx, t[i], i, t)) return false
        }
      }
    }

    return true;
  };
}


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
    var groupURLAggregator =  this._aggregator.groupFunction(groupSetting)
    var bottomUpGrouped = WebInspector.TimelineProfileTree.buildBottomUp(topDown, groupURLAggregator)
    // sort the grouped tree, in-place
    new TimelineModelTreeView(bottomUpGrouped).sortingChanged('self', 'desc')
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

module.exports = new SandboxedModel();
