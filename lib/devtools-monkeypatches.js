/* global Runtime Common Bindings Timeline UI */

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

// nerf to allow addReadableName to complete
Timeline.TimelineUIUtils.eventColor = _ => '';

// lifted from UIUtils.js
UI.beautifyFunctionName = function(name) {
  return name || Common.UIString('(anonymous)');
};
