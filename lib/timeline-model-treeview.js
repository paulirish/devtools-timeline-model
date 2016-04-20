/* global WebInspector */

// this duplicates some work inside of TimelineTreeView, SortedDataGrid and beyond.
// It's pretty difficult to extract, so we forked.

function TimelineModelTreeView(model) {
  this._rootNode = model
};

TimelineModelTreeView.prototype.sortingChanged = function (sortItem, sortOrder) {
  if (!sortItem)
    return
  var sortFunction
  switch (sortItem) {
    case 'startTime':
      sortFunction = compareStartTime
      break
    case 'self':
      sortFunction = compareNumericField.bind(null, 'selfTime')
      break
    case 'total':
      sortFunction = compareNumericField.bind(null, 'totalTime')
      break
    case 'activity':
      sortFunction = compareName
      break
    default:
      console.assert(false, 'Unknown sort field: ' + sortItem)
      return
  }
  return this.sortNodes(sortFunction, sortOrder !== 'asc')

  function compareNumericField (field, a, b) {
    var nodeA = (a[1])
    var nodeB = (b[1])
    return nodeA[field] - nodeB[field]
  }

  function compareStartTime (a, b) {
    var nodeA = (a[1])
    var nodeB = (b[1])
    return nodeA.event.startTime - nodeB.event.startTime
  }

  function compareName (a, b) {
    var nodeA = (a[1])
    var nodeB = (b[1])
    var nameA = WebInspector.TimelineTreeView.eventNameForSorting(nodeA.event)
    var nameB = WebInspector.TimelineTreeView.eventNameForSorting(nodeB.event)
    return nameA.localeCompare(nameB)
  }
}

TimelineModelTreeView.prototype.sortNodes = function (comparator, reverseMode) {
  this._sortingFunction = WebInspector.SortableDataGrid.Comparator.bind(null, comparator, reverseMode)
  this._rootNode._sortChildren(this._sortingFunction, reverseMode)
}

// sortChildren has major changes, as it now works on Maps rather than Arrays
WebInspector.TimelineProfileTree.Node.prototype._sortChildren = function (sortingFunction) {
  if (!this.children) return
  this.children = new Map([...this.children.entries()].sort(sortingFunction))
  for (var i = 0; i < this.children.length; ++i)
    this.children[i].recalculateSiblings(i)
  for (var child of this.children.values())
    child._sortChildren(sortingFunction)
}

WebInspector.TimelineProfileTree.Node.prototype.recalculateSiblings = function (myIndex) {
  if (!this.parent)
    return

  var previousChild = this.parent.children[myIndex - 1] || null
  if (previousChild)
    previousChild.nextSibling = this
  this.previousSibling = previousChild

  var nextChild = this.parent.children[myIndex + 1] || null
  if (nextChild)
    nextChild.previousSibling = this
  this.nextSibling = nextChild
}

module.exports = TimelineModelTreeView;
