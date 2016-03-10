
// polyfill for now
WebInspector.TimelineTreeView.eventStackFrame = function(event) {
    if (event.name == WebInspector.TimelineModel.RecordType.JSFrame)
        return event.args["data"];
    var topFrame = event.stackTrace && event.stackTrace[0];
    if (topFrame)
        return topFrame;
    var initiator = event.initiator;
    return initiator && initiator.stackTrace && initiator.stackTrace[0] || null;
}

Runtime.experiments.isEnabled = (exp) => exp === 'timelineLatencyInfo'

WebInspector.moduleSetting = function (module) {
  return { get: (_ => module == "showNativeFunctionsInJSProfile") }
}
