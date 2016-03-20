/* global WebInspector TimelineModelTreeView */
'use strict';

// DevTools relies on a global WebInspector variable. :(
// This callWithGlobals BS is a nasty hack to keep this global exclusive to our model
var callWithGlobals = require('call-with-globals');
// var sb = require('./lib/sandboxed-natives');
var fuse = require('./lib/fuse');

var _WebInspector = {}

var _Uint32Array = function (length) {
  var result = [], argLen = arguments.length
  if (argLen) {
    // ensure _Uint32Array acts like window.Array
    if (argLen === 1 && typeof length === 'number') {
      result.length = length
    } else {
      result.push.apply(result, arguments)
    }
  }
  // rewire the array’s __proto__ making it use
  // _Uint32Array.prototype instead of window.Array.prototype
  // when looking up methods/properties
  result.__proto__ = _Uint32Array.prototype
  return result
}
// set constructor's prototype as global native instances
_Uint32Array.prototype = Uint32Array


var _Float64Array = function (length) {
  var result = [], argLen = arguments.length
  if (argLen) {
    // ensure _Float64Array acts like window.Array
    if (argLen === 1 && typeof length === 'number') {
      result.length = length
    } else {
      result.push.apply(result, arguments)
    }
  }
  // rewire the array’s __proto__ making it use
  // _Float64Array.prototype instead of window.Array.prototype
  // when looking up methods/properties
  result.__proto__ = _Float64Array.prototype
  return result
}
// set constructor's prototype as global native instances
_Float64Array.prototype = Float64Array


fuse.fuse.Object.setPrototypeOf = Object.setPrototypeOf;
fuse.fuse.Object.defineProperty = Object.defineProperty;

var _WI_global = { WebInspector: _WebInspector, Array: fuse.fuse.Array,  Uint32Array: _Uint32Array, Object: fuse.fuse.Object, Float64Array: _Float64Array }; //,}

// var _WI_global = { WebInspector: _WebInspector }

class TraceToTimelineModel {

  constructor(events) {

    var instance = this;
    callWithGlobals(_ => {

      // Other globals and stubs
      require('./lib/api-stubs')
      // Pull in the devtools frontend
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
      require('./lib/devtools-init')
      // polyfill the bottom-up and topdown tree sorting
      require('./lib/timeline-model-treeview')

      // (devtools) tracing model
      instance._tracingModel = new WebInspector.TracingModel(new WebInspector.TempFileBackingStorage('tracing'))
      // timeline model
      instance._timelineModel = new WebInspector.TimelineModel(WebInspector.TimelineUIUtils.visibleEventsFilter())

      // populate with events
      instance._tracingModel.reset()
      instance._tracingModel.addEvents(typeof events === 'string' ? JSON.parse(events) : events)
      instance._tracingModel.tracingComplete()
      instance._timelineModel.setEvents(instance._tracingModel)

      instance._aggregator = new WebInspector.TimelineAggregator((event) => WebInspector.TimelineUIUtils.eventStyle(event).category.name)

    }, _WI_global);

    return this;
  }

  timelineModel() {
    return this._timelineModel;
  }

  tracingModel() {
    return this._tracingModel;
  }

  topDown() {
    var instance = this;
    var topDown;
    callWithGlobals(_ => {

      var filters = [];
      filters.push(WebInspector.TimelineUIUtils.visibleEventsFilter());
      filters.push(new WebInspector.ExcludeTopLevelFilter());
      var nonessentialEvents = [
        WebInspector.TimelineModel.RecordType.EventDispatch,
        WebInspector.TimelineModel.RecordType.FunctionCall,
        WebInspector.TimelineModel.RecordType.TimerFire
      ];
      filters.push(new WebInspector.ExclusiveNameFilter(nonessentialEvents));

      topDown = WebInspector.TimelineProfileTree.buildTopDown(instance._timelineModel.mainThreadEvents(),
                    filters, /* startTime */ 0, /* endTime */ Infinity, WebInspector.TimelineAggregator.eventId)

    }, _WI_global);
    return topDown;
  }

  bottomUp() {
    var instance = this;
    var bottomUp;
    callWithGlobals(_ => {
      var topDown = instance.topDown();
      var noGrouping = WebInspector.TimelineAggregator.GroupBy.None
      var noGroupAggregator =  instance._aggregator.groupFunction(noGrouping)
      bottomUp = WebInspector.TimelineProfileTree.buildBottomUp(topDown, noGroupAggregator)
    }, _WI_global);
    return bottomUp;
  }

  // @ returns a grouped and sorted tree
  bottomUpGroupBy(grouping) {
    var instance = this;
    var bottomUpGrouped;
    callWithGlobals(_ => {
      var topDown = instance.topDown();
      var groupSetting = WebInspector.TimelineAggregator.GroupBy[grouping] // one of: None Category Subdomain Domain URL
      var groupURLAggregator =  instance._aggregator.groupFunction(groupSetting)
      bottomUpGrouped = WebInspector.TimelineProfileTree.buildBottomUp(topDown, groupURLAggregator)
      // sort the grouped tree, in-place
      new TimelineModelTreeView(bottomUpGrouped).sortingChanged('self', 'desc')
    }, _WI_global);
    return bottomUpGrouped
  }

  frameModel() {
    var instance = this;
    var frameModel;
    callWithGlobals(_ => {
      frameModel = new WebInspector.TracingTimelineFrameModel()
      frameModel.addTraceEvents({ /* target */ }, instance._timelineModel.inspectedTargetEvents(), instance._timelineModel.sessionId() || '')
    }, _WI_global);
    return frameModel
  }

  filmStripModel() {
    var instance = this;
    var fsModel;
    callWithGlobals(_ => {
      fsModel = new WebInspector.FilmStripModel(instance._tracingModel)
    }, _WI_global);
    return fsModel;
  }

  interactionModel() {
    var instance = this;
    var irModel;
    callWithGlobals(_ => {
      irModel = new WebInspector.TimelineIRModel()
      irModel.populate(instance._timelineModel)
    }, _WI_global);
    return irModel
  }
}

module.exports = TraceToTimelineModel
