/* global WebInspector TimelineModelTreeView */
'use strict';

require('./lib/api-stubs')

// Pull in the devtools frontend
require('chrome-devtools-frontend/front_end/common/Object.js')
require('chrome-devtools-frontend/front_end/common/SegmentedRange.js')

//    We need to barely rewrite just one of these files.
//    Expose any function declarations as assignments to the global obj
//    FIXME: remove hack once insertionIndexForObjectInListSortedByFunction is sorted.
var hook = require('node-hook')
hook.hook('.js', (source) => source.replace(/\nfunction\s(\S+)\(/g, '\n$1 = function('))
require('chrome-devtools-frontend/front_end/platform/utilities.js')
hook.unhook('.js')

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

// local libs
require('./lib/devtools-init')
require('./lib/timeline-model-treeview')

class TraceToTimelineModel {

  constructor(events) {
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

module.exports = TraceToTimelineModel
