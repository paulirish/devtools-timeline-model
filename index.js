'use strict';

var fs = require('fs');
var vm = require('vm');

/* eslint-disable no-native-reassign */
if (typeof __dirname === 'undefined') {
  __dirname = '';
}
/* eslint-enable no-native-reassign */

class ModelAPI {

  constructor(events) {

    // Everything happens in a sandboxed vm context, to keep globals and natives separate.
    // First, sandboxed contexts don't have any globals from node, so we whitelist a few we'll provide for it.
    var glob = {require: require, global: global, console: console, __dirname: __dirname};
    // We read in our script to run, and create a vm.Script object
    /* eslint-disable no-path-concat */
    var script = new vm.Script(fs.readFileSync(__dirname + '/lib/timeline-model.js', 'utf8'));
    /* eslint-enable no-path-concat */
    // We create a new V8 context with our globals
    var ctx = vm.createContext(glob);
    // We evaluate the `vm.Script` in the new context
    script.runInContext(ctx);
    // We pull the local `instance` variable out, to use as our proxy object
    this.sandbox = ctx.sandboxedModel;
    this.sandbox.init(events);

    return this;
  }

  timelineModel() {
    return this.sandbox.timelineModel();
  }

  tracingModel() {
    return this.sandbox.tracingModel();
  }

  topDown(opts = {}) {
    const defaults = {startTime: 0, endTime: Infinity};
    return this.sandbox.topDown({...defaults, ...opts});
  }

  topDownGroupBy(grouping, opts = {}) {
    const defaults = {startTime: 0, endTime: Infinity, allEvents: false};
    return this.sandbox.topDownGroupBy(grouping, {...defaults, ...opts});
  }

  bottomUp(opts = {}) {
    const defaults = {startTime: 0, endTime: Infinity};
    return this.sandbox.bottomUp({...defaults, ...opts});
  }

  /**
   * @ param  {!String} grouping Allowed values: None Category Subdomain Domain URL Name
   * @ return {!WebInspector.TimelineProfileTree.Node} A grouped and sorted tree
   */
  bottomUpGroupBy(grouping, opts = {}) {
    const defaults = {allEvents: false, startTime: 0, endTime: Infinity};
    return this.sandbox.bottomUpGroupBy(grouping, {...defaults, ...opts});
  }

  frameModel() {
    return this.sandbox.frameModel();
  }

  filmStripModel() {
    return this.sandbox.filmStripModel();
  }


  interactionModel() {
    return this.sandbox.interactionModel();
  }
}

module.exports = ModelAPI;
