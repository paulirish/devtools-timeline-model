/* global Runtime Common Bindings */

Runtime.experiments = {};
Runtime.experiments.isEnabled = exp => exp === 'timelineLatencyInfo';

Common.moduleSetting = function(module) {
  return {get: _ => module === 'showNativeFunctionsInJSProfile'};
};

// DevTools makes a few assumptions about using backing storage to hold traces.
Bindings.DeferredTempFile = function() {};
Bindings.DeferredTempFile.prototype = {
  write: _ => { },
  remove: _ => { },
  finishWriting: _ => { }
};
