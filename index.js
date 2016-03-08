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
require('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineIRModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineFrameModel.js')

function traceToTimelineModel (events) {
  Runtime.experiments.isEnabled = (exp) => exp === 'timelineLatencyInfo'

  // (devtools) tracing model
  var tracingModel = new WebInspector.TracingModel(new WebInspector.TempFileBackingStorage('tracing'))
  // timeline model
  var timelineModel = new WebInspector.TimelineModel(WebInspector.TimelineUIUtils.visibleEventsFilter())

  // add events to it
  tracingModel.reset()
  tracingModel.addEvents(typeof events === 'string' ? JSON.parse(events) : events)
  tracingModel.tracingComplete()
  timelineModel.setEvents(tracingModel)

  // tree views (bottom up & top down)
  // they are too mixed up with the view. can't do right now.
  //      require('./timeline/TimelineTreeView.js')
  //      var treeViewContext = { element: { classList : { add: noop } } }
  //      var boundBottomUp = WebInspector.BottomUpTimelineTreeView.bind(treeViewContext, timelineModel)
  //      var bottomUpTree = new boundBottomUp()

  // frame model
  var frameModel = new WebInspector.TracingTimelineFrameModel()
  frameModel.addTraceEvents({ /* target */ }, timelineModel.inspectedTargetEvents(), timelineModel.sessionId() || '')

  var filmStripModel = new WebInspector.FilmStripModel(tracingModel)

  // interaction model
  var irModel = new WebInspector.TimelineIRModel()
  irModel.populate(timelineModel)

  return {
    timelineModel: timelineModel,
    irModel: irModel,
    frameModel: frameModel,
    filmStripModel: filmStripModel
  }
}

module.exports = traceToTimelineModel
