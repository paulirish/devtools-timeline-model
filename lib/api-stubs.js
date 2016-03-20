/* global WebInspector Runtime WorkerRuntime Protocol */

var noop = function () {}

var _WebInspector = global.WebInspector = {};

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


require('chrome-devtools-frontend/front_end/common/Object.js')
require('chrome-devtools-frontend/front_end/common/SegmentedRange.js')
require('chrome-devtools-frontend/front_end/platform/utilities.js')
require('chrome-devtools-frontend/front_end/sdk/Target.js')
require('chrome-devtools-frontend/front_end/bindings/TempFile.js')
require('chrome-devtools-frontend/front_end/sdk/TracingModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineJSProfile.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js')
require('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js')
require('chrome-devtools-frontend/front_end/timeline/LayerTreeModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js')
require('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineProfileTree.js')
require('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineIRModel.js')
require('chrome-devtools-frontend/front_end/timeline/TimelineFrameModel.js')
// minor configurations
require('./devtools-init')
// polyfill the bottom-up and topdown tree sorting
require('./timeline-model-treeview')

module.exports = _WebInspector;
