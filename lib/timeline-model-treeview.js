
// this duplicates some work inside of TimelineTreeView, SortedDataGrid and beyond.
// It's pretty difficult to extract, so we forked.

/* global Timeline UI self */

function TimelineModelTreeView(model, grouping) {
  this._rootNode = model;
  this._grouping = grouping;
}

// from Timeline.TimelineTreeView._sortingChanged
// but tweaked so this._dataGrid.sortColumnId() is set as to sortItem
// and this._dataGrid.isSortOrderAscending() is set as (sortOrder !== 'asc')
TimelineModelTreeView.prototype.sortingChanged = function(sortItem, sortOrder) {
  if (!sortItem)
    return;
  var sortFunction;
  switch (sortItem) {
    case 'startTime':
      sortFunction = compareStartTime;
      break;
    case 'self':
      sortFunction = compareNumericField.bind(null, 'selfTime');
      break;
    case 'total':
      sortFunction = compareNumericField.bind(null, 'totalTime');
      break;
    case 'activity':
      sortFunction = compareName;
      break;
    default:
      console.assert(false, 'Unknown sort field: ' + sortItem);
      return;
  }
  return this.sortNodes(sortFunction, sortOrder !== 'asc');

  // these functions adjusted to handle Map entries() rather than objects
  function compareNumericField(field, a, b) {
    var nodeA = (a[1]);
    var nodeB = (b[1]);
    return nodeA[field] - nodeB[field];
  }

  function compareStartTime(a, b) {
    var nodeA = (a[1]);
    var nodeB = (b[1]);
    return nodeA.event.startTime - nodeB.event.startTime;
  }

  function compareName(a, b) {
    var nodeA = (a[1]);
    var nodeB = (b[1]);
    var nameA = Timeline.TimelineTreeView.eventNameForSorting(nodeA.event);
    var nameB = Timeline.TimelineTreeView.eventNameForSorting(nodeB.event);
    return nameA.localeCompare(nameB);
  }

};

// from SortableDataGrid.sortNodes()
TimelineModelTreeView.prototype.sortNodes = function(comparator, reverseMode) {
  this._sortingFunction = UI.SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
  this.sortChildren(this._rootNode);
};

/**
 * sortChildren has major changes, as it now works on Maps rather than Arrays
 *   from SortableDataGrid._sortChildren()
 * @param  {WebInspector.TimelineProfileTree.Node} parent
 * @param  {any} sortingFunction
 */
TimelineModelTreeView.prototype.sortChildren = function(parent) {
  if (!parent.children) return;
  parent.children = [...parent.children.entries()].sort(this._sortingFunction);
  for (var i = 0; i < parent.children.length; ++i) {
    recalculateSiblings(parent.children[i], i);
    addReadableName(parent.children[i], this._grouping);
  }
  parent.children = new Map(parent.children);
  for (var child of parent.children.values())
    this.sortChildren(child);
};

/**
 * from DataGrid.recalculateSiblings()
 * @param  {WebInspector.TimelineProfileTree.Node} node
 * @param  {any} myIndex
 */
function recalculateSiblings(node, myIndex) {
  if (!node.parent)
    return;

  var previousChild = node.parent.children[myIndex - 1] || null;
  if (previousChild)
    previousChild.nextSibling = node;
  node.previousSibling = previousChild;

  var nextChild = node.parent.children[myIndex + 1] || null;
  if (nextChild)
    nextChild.previousSibling = node;
  node.nextSibling = nextChild;
}

function addReadableName(node, grouping) {
  node = node[1]; // grab value from the map

  let readableName;
  if (node.isGroupNode() && grouping !== 'None') {
    var treeViewContext = {
      _groupBySetting: {
        get: _ => grouping
      },
      _executionContextNamesByOrigin: new Map(),
      _model: {
        pageFrameById: _ => ''
      }
    };
    var displayInfoForGroupNode = Timeline.AggregatedTimelineTreeView.prototype._displayInfoForGroupNode;
    readableName = displayInfoForGroupNode.call(treeViewContext, node).name;
  } else {
    readableName = Timeline.TimelineUIUtils.eventTitle(node.event);
  }

  console.log();
  if (!readableName) readableName = node.id;

  node.readableName = readableName;
}

self.TimelineModelTreeView = TimelineModelTreeView;
