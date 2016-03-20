/* global WebInspector TimelineModelTreeView */
'use strict';

var sm = require('sandboxed-module');


// DevTools relies on a global WebInspector variable. :(
// This callWithGlobals BS is a nasty hack to keep this global exclusive to our model
var WebInspector = {}


// var _WI_global = { WebInspector: _WebInspector }

class TraceToTimelineModel {

  constructor(events) {

    var instance = this;


      // Other globals and stubs
      var WebInspector = sm.require('./lib/api-stubs', { globals: { WebInspector: WebInspector }})
      // Pull in the devtools frontend


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
