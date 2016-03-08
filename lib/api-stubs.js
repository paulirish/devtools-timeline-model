/* global WebInspector Runtime WorkerRuntime Protocol */

// Required for a select portion DevTools frontend to work (in node)
global.self = global
global.window = global
global.WebInspector = {}
global.Runtime = {}
global.TreeElement = {}
global.WorkerRuntime = {}
global.Protocol = {}
var noop = function () {}
WorkerRuntime.Worker = noop
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
WebInspector.SortableDataGridNode = {}
WebInspector.UIString = (str) => str
Protocol.Agents = {}
Runtime.experiments = {}

// no exports as we're preparing the global scope
