/* global Runtime WebInspector */

Runtime.experiments = {};
Runtime.experiments.isEnabled = exp => exp === 'timelineLatencyInfo';

Common.moduleSetting = function(module) {
  return {get: _ => module === 'showNativeFunctionsInJSProfile'};
};

// DevTools makes a few assumptions about using backing storage to hold traces.
Bindings.DeferredTempFile = function() {};
Bindings.DeferredTempFile.prototype = {
  write: function() {},
  finishWriting: function() {}
};
