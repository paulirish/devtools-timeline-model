
// polyfill for now
WebInspector.TimelineTreeView.eventStackFrame = function(event) {
    if (event.name == WebInspector.TimelineModel.RecordType.JSFrame)
        return event.args["data"];
    var topFrame = event.stackTrace && event.stackTrace[0];
    if (topFrame)
        return topFrame;
    var initiator = event.initiator;
    return initiator && initiator.stackTrace && initiator.stackTrace[0] || null;
}


Runtime.experiments.isEnabled = (exp) => exp === 'timelineLatencyInfo'


WebInspector.moduleSetting = function (module) {
  return { get: (_ => module == "showNativeFunctionsInJSProfile") }
}


// sort style: columnIdentifier, descending? true
    // _sortingChanged:

TimelineModelTreeView = function(model) {
  this._rootNode = model;
}

TimelineModelTreeView.prototype.sortingChanged = function(columnIdentifier, isSortOrderAscending) {
    if (!columnIdentifier)
        return;
    var sortFunction;
    switch (columnIdentifier) {
    case "startTime":
        sortFunction = compareStartTime;
        break;
    case "self":
        sortFunction = compareNumericField.bind(null, "selfTime");
        break;
    case "total":
        sortFunction = compareNumericField.bind(null, "totalTime");
        break;
    case "activity":
        sortFunction = compareName;
        break;
    default:
        console.assert(false, "Unknown sort field: " + columnIdentifier);
        return;
    }
    return this.sortNodes(sortFunction, !isSortOrderAscending);

    /**
     * @param {string} field
     * @param {!WebInspector.DataGridNode} a
     * @param {!WebInspector.DataGridNode} b
     * @return {number}
     */
    function compareNumericField(field, a, b)
    {
        var nodeA = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (a[1]);
        var nodeB = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (b[1]);
        return nodeA[field] - nodeB[field];
    }

    /**
     * @param {!WebInspector.DataGridNode} a
     * @param {!WebInspector.DataGridNode} b
     * @return {number}
     */
    function compareStartTime(a, b)
    {
        var nodeA = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (a[1]);
        var nodeB = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (b[1]);
        return nodeA.event.startTime - nodeB.event.startTime;
    }

    /**
     * @param {!WebInspector.DataGridNode} a
     * @param {!WebInspector.DataGridNode} b
     * @return {number}
     */
    function compareName(a, b)
    {
        var nodeA = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (a[1]);
        var nodeB = /** @type {!WebInspector.TimelineTreeView.TreeGridNode} */ (b[1]);
        var nameA = WebInspector.TimelineTreeView.eventNameForSorting(nodeA.event);
        var nameB = WebInspector.TimelineTreeView.eventNameForSorting(nodeB.event);
        return nameA.localeCompare(nameB);
    }
  };

TimelineModelTreeView.prototype.sortNodes = function(comparator, reverseMode) {
    this._sortingFunction = WebInspector.SortableDataGrid.Comparator.bind(null, comparator, reverseMode);
    this._rootNode._sortChildren(this._sortingFunction, reverseMode);
}


WebInspector.TimelineProfileTree.Node.prototype._sortChildren = function(sortingFunction) {
    if (!this.children) return
    this.children = new Map([...this.children.entries()].sort(sortingFunction));
    for (var i = 0; i < this.children.length; ++i)
        this.children[i].recalculateSiblings(i);
    for (var child of this.children.values())
        child._sortChildren(sortingFunction);
};

WebInspector.TimelineProfileTree.Node.prototype.recalculateSiblings = function(myIndex) {
    if (!this.parent)
        return;

    var previousChild = this.parent.children[myIndex - 1] || null;
    if (previousChild)
        previousChild.nextSibling = this;
    this.previousSibling = previousChild;

    var nextChild = this.parent.children[myIndex + 1] || null;
    if (nextChild)
        nextChild.previousSibling = this;
    this.nextSibling = nextChild;
};
