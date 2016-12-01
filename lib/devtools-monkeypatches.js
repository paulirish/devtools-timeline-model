/* global Runtime Common Bindings */

Runtime.experiments = {};
// runtime callstats requires 'disabled-by-default-v8.runtime_stats_sampling'
Runtime.experiments.isEnabled = exp => exp === 'timelineLatencyInfo' || exp === 'timelineV8RuntimeCallStats';

Common.moduleSetting = function(module) {
  return {get: _ => module === 'showNativeFunctionsInJSProfile'};
};

// DevTools makes a few assumptions about using backing storage to hold traces.
Bindings.DeferredTempFile = function() {};
Bindings.DeferredTempFile.prototype = {
  write: function() {},
  finishWriting: function() {}
};
