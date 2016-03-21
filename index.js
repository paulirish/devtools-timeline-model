/* global WebInspector TimelineModelTreeView */
'use strict';

var sm = require('sandboxed-module');

var WebInspector = {}
class TraceToTimelineModel {

  constructor(events) {

    // pull devtools frontend and stubs.
    this.sandbox = sm.load('./lib/api-stubs', { globals: { WebInspector: WebInspector }})
    debugger;
    this.sandbox.exports.init(events);

    return this;
  }

  timelineModel() {
    return this.sandbox.timelineModel();
  }

  tracingModel() {
    return this.sandbox.tracingModel();
  }

  topDown() {
    return this.sandbox.topDown();
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
