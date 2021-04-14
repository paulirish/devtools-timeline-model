/* global Runtime Common Bindings */

Runtime.experiments = {};
Runtime.experiments.isEnabled = exp => exp === 'timelineLatencyInfo';

Common.console = console;

Common.moduleSetting = function(module) {
  return {get: _ => module === 'showNativeFunctionsInJSProfile'};
};

Common.settings = {
  createSetting() {
    return {
      get() {
        return false;
      },
      addChangeListener() {},
    };
  }
};

// DevTools makes a few assumptions about using backing storage to hold traces.
Bindings.TempFile = function() {};
Bindings.TempFile.prototype = {
  write: _ => { },
  remove: _ => { },
  size: _ => 0,
  readRange: _ => Promise.resolve(),
  finishWriting: _ => { }
};
