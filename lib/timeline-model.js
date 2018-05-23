'use strict';

/* global TimelineModel SDK Bindings Timeline TimelineModelTreeView */

const fs = require('fs');
const resolve = require('resolve');

// In order to maintain consistent global scope across the files,
// and share natives like Array, etc, We will eval things within our sandbox
function requireval(path) {
  const res = resolve.sync(path, {basedir: __dirname});
  const filesrc = fs.readFileSync(res, 'utf8');
  // eslint-disable-next-line no-eval
  eval(filesrc + '\n\n//# sourceURL=' + path);
}

// establish our sandboxed globals
this.window = this.self = this.global = this;
this.console = console;

// establish our sandboxed globals
this.Runtime = class {};
this.Protocol = class {};
this.TreeElement = class {};

// from generated externs.
// As of node 7.3, instantiating these globals must be here rather than in api-stubs.js
this.Accessibility = {};
this.Animation = {};
this.Audits = {};
this.Audits2 = {};
this.Audits2Worker = {};
this.Bindings = {};
this.CmModes = {};
this.Common = {};
this.Components = {};
this.Console = {};
this.DataGrid = {};
this.Devices = {};
this.Diff = {};
this.Elements = {};
this.Emulation = {};
this.Extensions = {};
this.FormatterWorker = {};
this.Gonzales = {};
this.HeapSnapshotWorker = {};
this.Host = {};
this.LayerViewer = {};
this.Layers = {};
this.Main = {};
this.Network = {};
this.Persistence = {};
this.Platform = {};
this.Profiler = {};
this.Resources = {};
this.Sass = {};
this.Screencast = {};
this.SDK = {};
this.Security = {};
this.Services = {};
this.Settings = {};
this.Snippets = {};
this.SourceFrame = {};
this.Sources = {};
this.Terminal = {};
this.TextEditor = {};
this.Timeline = {};
this.TimelineModel = {};
this.ToolboxBootstrap = {};
this.UI = {};
this.UtilitySharedWorker = {};
this.WorkerService = {};
this.Workspace = {};

requireval('./lib/api-stubs.js');

// chrome devtools frontend
requireval('chrome-devtools-frontend/front_end/common/Object.js');
requireval('chrome-devtools-frontend/front_end/platform/utilities.js');
requireval('chrome-devtools-frontend/front_end/common/ParsedURL.js');
requireval('chrome-devtools-frontend/front_end/common/UIString.js');
requireval('chrome-devtools-frontend/front_end/sdk/Target.js');
requireval('chrome-devtools-frontend/front_end/sdk/LayerTreeBase.js');
requireval('chrome-devtools-frontend/front_end/common/SegmentedRange.js');
requireval('chrome-devtools-frontend/front_end/bindings/TempFile.js');
requireval('chrome-devtools-frontend/front_end/sdk/TracingModel.js');
requireval('chrome-devtools-frontend/front_end/sdk/ProfileTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineJSProfile.js');
requireval('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
requireval('chrome-devtools-frontend/front_end/layers/LayerTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineModelFilter.js');
requireval('chrome-devtools-frontend/front_end/data_grid/SortableDataGrid.js');

requireval('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineProfileTree.js');
requireval('chrome-devtools-frontend/front_end/sdk/FilmStripModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineIRModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineFrameModel.js');

requireval('chrome-devtools-frontend/front_end/timeline/PerformanceModel.js');

// minor configurations
requireval('./lib/devtools-monkeypatches.js');

// polyfill the bottom-up and topdown tree sorting
requireval('./lib/timeline-model-treeview.js');

class SandboxedModel {

  init(events) {
    // build empty models. (devtools) tracing model & timeline model
    //   from Timeline.TimelinePanel() constructor
    this._tracingModel = new SDK.TracingModel(new Bindings.TempFileBackingStorage('tracing'));
    this._timelineModel = new TimelineModel.TimelineModel(Timeline.TimelineUIUtils.visibleEventsFilter());

    if (typeof events === 'string') events = JSON.parse(events);
    // WebPagetest trace files put events in object under key `traceEvents`
    if (events.hasOwnProperty('traceEvents')) events = events.traceEvents;
    // WebPageTest trace files often have an empty object at index 0
    if (Object.keys(events[0]).length === 0) events.shift();


    this._timelineModel._reset();
    this._tracingModel.addEvents(events);
    this._tracingModel.tracingComplete();


    this._performanceModel = new Timeline.PerformanceModel();
    this._performanceModel.setTracingModel(this._tracingModel);
    return this;
  }

  _createGroupingFunction(groupBy) {
    return Timeline.AggregatedTimelineTreeView.prototype._groupingFunction(groupBy);
  }

  performanceModel() {
    return this._performanceModel;
  }

  timelineModel() {
    return this._performanceModel._timelineModel;
  }

  tracingModel() {
    return this._performanceModel._tracingModel;
  }

  topDown(startTime = 0, endTime = Infinity) {
    return this.topDownGroupBy(Timeline.AggregatedTimelineTreeView.GroupBy.None, startTime, endTime);
  }

  _buildTree(direction, grouping, startTime = 0, endTime = Infinity) {
    // from Timeline.AggregatedTimelineTreeView constructor()
    const filters = [];
    filters.push(Timeline.TimelineUIUtils.visibleEventsFilter());
    filters.push(new TimelineModel.ExcludeTopLevelFilter());
    const nonessentialEvents = [
      TimelineModel.TimelineModel.RecordType.EventDispatch,
      TimelineModel.TimelineModel.RecordType.FunctionCall,
      TimelineModel.TimelineModel.RecordType.TimerFire
    ];
    filters.push(new TimelineModel.ExclusiveNameFilter(nonessentialEvents));

    const groupingAggregator = this._createGroupingFunction(Timeline.AggregatedTimelineTreeView.GroupBy[grouping]);

    // hax wtf
    const mainThread = this._performanceModel.timelineModel().tracks().filter(e => e.forMainFrame)[0];
    const mockTreeViewInstance = {
      _model: this._performanceModel,
      _track: mainThread,
      _tree: null,
      _modelEvents: () => mainThread.events,
      filters: () => [],
      _startTime: startTime,
      _endTime: endTime,
    };
    if (direction === 'topdown') {
      return Timeline.AggregatedTimelineTreeView.prototype.buildTopDownTree.call(mockTreeViewInstance, groupingAggregator);
    } else if (direction === 'bottomup') {
      return new TimelineModel.TimelineProfileTree.BottomUpRootNode(
        mockTreeViewInstance._modelEvents(), mockTreeViewInstance.filters(), mockTreeViewInstance._startTime, mockTreeViewInstance._endTime,
        groupingAggregator);
    } else {
      throw new Error('unknown');
    }

    const treeClassName = direction === 'topdown' ? 'buildTopDownTree' : direction === 'bottomup' ? 'BottomUpTimelineTreeView' : '___';
    return Timeline.AggregatedTimelineTreeView.prototype[treeClassName].call(mockTreeViewInstance, groupingAggregator);

    // const tree = new Timeline[treeClassName](this._timelineModel.mainThreadEvents(),
    //   filters, startTime, endTime, groupingAggregator);
    // tree.setModel(this._performanceModel);
    // return tree;
  }

  topDownGroupBy(grouping, startTime = 0, endTime = Infinity) {
    const tree = this._buildTree('topdown', grouping, startTime, endTime);
    new TimelineModelTreeView(tree).sortingChanged('total', 'desc');
    return tree;
  }

  bottomUp(startTime = 0, endTime = Infinity) {
    return this.bottomUpGroupBy(Timeline.AggregatedTimelineTreeView.GroupBy.None, startTime, endTime);
  }

  /**
   * @param  {!string} grouping Allowed values: None Category Subdomain Domain URL EventName
   * @return {!TimelineModel.TimelineProfileTree.Node} A grouped and sorted tree
   */
  bottomUpGroupBy(grouping, startTime = 0, endTime = Infinity) {

    const tree = this._buildTree('bottomup', grouping, startTime, endTime);
    new TimelineModelTreeView(tree).sortingChanged('self', 'desc');

    // todo: understand why an empty key'd entry is created here
    tree.children().delete('');
    return tree;
  }

  frameModel() {
    return this._performanceModel._frameModel;
  }

  filmStripModel() {
    return new SDK.FilmStripModel(this._tracingModel);
  }

  interactionModel() {
    const irModel = new TimelineModel.TimelineIRModel();
    irModel.populate(this._timelineModel);
    return irModel;
  }
}

var sandboxedModel = new SandboxedModel();
// no exports as we're a sandboxed/eval'd module.
