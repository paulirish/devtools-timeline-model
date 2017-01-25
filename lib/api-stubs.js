/* global Protocol UI SDK */

var noop = function() { };

// other neccessary stubs
Protocol.TargetBase = noop;
Protocol.Agents = {};

UI.VBox = noop;
UI.ViewportDataGrid = noop;
UI.ViewportDataGridNode = noop;
UI.TreeElement = noop;

DataGrid.ViewportDataGrid = noop;
DataGrid.ViewportDataGridNode = noop;

SDK.targetManager = {};
SDK.targetManager.mainTarget = noop;
