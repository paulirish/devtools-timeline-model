/* global Runtime WebInspector */

Runtime.experiments.isEnabled = exp => exp === 'timelineLatencyInfo';

WebInspector.moduleSetting = function(module) {
  return {get: _ => module === 'showNativeFunctionsInJSProfile'};
};

// DevTools makes a few assumptions about using backing storage to hold traces.
WebInspector.DeferredTempFile = function() {};
WebInspector.DeferredTempFile.prototype = {
  write: function() {},
  finishWriting: function() {}
};
