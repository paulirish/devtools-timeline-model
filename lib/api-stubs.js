/* global WebInspector Runtime WorkerRuntime Protocol */

var noop = function () {}

// Required for a select portion DevTools frontend to work (in node)
global.self = global
global.window = global

global.Runtime = {}
global.TreeElement = {}
global.WorkerRuntime = {}
global.Protocol = {}

WebInspector.targetManager = {}
WebInspector.targetManager.observeTargets = noop
WebInspector.settings = {}
WebInspector.settings.createSetting = noop
WebInspector.console = {}
WebInspector.console.error = noop
WebInspector.moduleSetting = function () { return { get: noop } }
WebInspector.DeferredLayerTree = {}
WebInspector.VBox = noop
WebInspector.HBox = noop
WebInspector.ViewportDataGrid = noop
WebInspector.ViewportDataGridNode = noop
WebInspector.SortableDataGridNode = {}
WebInspector.UIString = (str) => str
Protocol.Agents = {}
Runtime.experiments = {}
WorkerRuntime.Worker = noop
WebInspector.TimelineTreeView = {}

// no exports as we're preparing the global scope
