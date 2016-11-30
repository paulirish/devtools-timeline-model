
// this duplicates some work inside of TimelineTreeView, SortedDataGrid and beyond.
// It's pretty difficult to extract, so we forked.

/* global Timeline UI self */

function TimelineModelTreeView(model) {
  this._rootNode = model;
}


// set this._dataGrid.sortColumnId() to sortItem
// set this._dataGrid.isSortOrderAscending() to sortOrder !== 'asc'

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

  /**
   * @param {string} field
   * @param {!UI.DataGridNode} a
   * @param {!UI.DataGridNode} b
   * @return {number}
   */
  function compareNumericField(field, a, b) {
    var nodeA = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (a);
    var nodeB = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (b);
    return nodeA._profileNode[field] - nodeB._profileNode[field];
  }

  /**
   * @param {!UI.DataGridNode} a
   * @param {!UI.DataGridNode} b
   * @return {number}
   */
  function compareStartTime(a, b) {
    var nodeA = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (a);
    var nodeB = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (b);
    return nodeA._profileNode.event.startTime - nodeB._profileNode.event.startTime;
  }

  /**
   * @param {!UI.DataGridNode} a
   * @param {!UI.DataGridNode} b
   * @return {number}
   */
  function compareName(a, b) {
    var nodeA = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (a);
    var nodeB = /** @type {!Timeline.TimelineTreeView.TreeGridNode} */ (b);
    var nameA = Timeline.TimelineTreeView.eventNameForSorting(nodeA._profileNode.event);
    var nameB = Timeline.TimelineTreeView.eventNameForSorting(nodeB._profileNode.event);
    return nameA.localeCompare(nameB);
  }
};

// from SortableDataGrid.sortNodes()
TimelineModelTreeView.prototype.sortNodes = function(comparator, reverseMode) {
  this._sortingFunction = UI.SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
  sortChildren(this._rootNode, this._sortingFunction, reverseMode);
};

/**
 * sortChildren has major changes, as it now works on Maps rather than Arrays
 *   from SortableDataGrid._sortChildren()
 * @param  {WebInspector.TimelineProfileTree.Node} parent
 * @param  {any} sortingFunction
 */
function sortChildren(parent, sortingFunction) {
  if (!parent.children || parent.children.size !== 0) return;
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
