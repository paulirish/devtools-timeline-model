
// this duplicates some work inside of TimelineTreeView, SortedDataGrid and beyond.
// It's pretty difficult to extract, so we forked.

/* global Timeline DataGrid self */

function TimelineModelTreeView(model) {
  this._rootNode = model;
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
  this._sortingFunction = DataGrid.SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
  sortChildren(this._rootNode, this._sortingFunction, reverseMode);
};

/**
 * sortChildren has major changes, as it now works on Maps rather than Arrays
 *   from SortableDataGrid._sortChildren()
 * @param  {WebInspector.TimelineProfileTree.Node} parent
 * @param  {any} sortingFunction
 */
function sortChildren(parent, sortingFunction) {
  if (!parent.children) return;
  parent.children = new Map([...parent.children.entries()].sort(sortingFunction));
  for (var i = 0; i < parent.children.length; ++i)
    recalculateSiblings(parent.children[i], i);
  for (var child of parent.children.values())
    sortChildren(child, sortingFunction);
}

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

self.TimelineModelTreeView = TimelineModelTreeView;
