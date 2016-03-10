/* global Runtime WebInspector */

Runtime.experiments.isEnabled = (exp) => exp === 'timelineLatencyInfo'

WebInspector.moduleSetting = function (module) {
  return { get: (_) => module === 'showNativeFunctionsInJSProfile' }
}
