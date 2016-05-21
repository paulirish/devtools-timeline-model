/* global WebInspector Runtime WorkerRuntime Protocol */

var noop = function() {};

WebInspector.targetManager = {};
WebInspector.targetManager.observeTargets = noop;
WebInspector.settings = {};
WebInspector.settings.createSetting = noop;
WebInspector.console = {};
WebInspector.console.error = noop;
WebInspector.moduleSetting = function() {
  return {get: noop};
};
WebInspector.DeferredLayerTree = {};
WebInspector.VBox = noop;
WebInspector.HBox = noop;
WebInspector.ViewportDataGrid = noop;
WebInspector.ViewportDataGridNode = noop;
WebInspector.SortableDataGridNode = {};
WebInspector.UIString = str => str;
Protocol.Agents = {};
Runtime.experiments = {};
WorkerRuntime.Worker = noop;
WebInspector.TimelineTreeView = {};

