/* global Runtime WebInspector */

Runtime.experiments.isEnabled = (exp) => exp === 'timelineLatencyInfo'

WebInspector.moduleSetting = function (module) {
  return { get: (_) => module === 'showNativeFunctionsInJSProfile' }
}

// DevTools makes a few assumptions about using backing storage to hold traces.
WebInspector.DeferredTempFile = function(){};
WebInspector.DeferredTempFile.prototype = {
  write : function(){},
  finishWriting: function(){}
}

// add support for groupBy('Name')
WebInspector.TimelineAggregator.GroupBy['EventName'] = 'EventName';

const old_nodeToGroupIdFunction = WebInspector.TimelineAggregator.prototype._nodeToGroupIdFunction;
WebInspector.TimelineAggregator.prototype._nodeToGroupIdFunction = function(groupBy) {
  if (groupBy === WebInspector.TimelineAggregator.GroupBy.EventName) {
    return node => node.event.name;
  }
  return old_nodeToGroupIdFunction.apply(this, arguments);
}
