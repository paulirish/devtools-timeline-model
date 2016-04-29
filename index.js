'use strict';

var fs = require('fs');
var vm = require('vm');

class ModelAPI {

  constructor(events) {

    // Everything happens in a sandboxed vm context, to keep globals and natives separate.
    // First, sandboxed contexts don't have any globals from node, so we whitelist a few we'll provide for it.
    var glob = {require: require, global: global, console: console, process: process, __dirname: __dirname};
    // We read in our script to run, and create a vm.Script object
    var script = new vm.Script(fs.readFileSync(__dirname + '/lib/timeline-model.js', 'utf8'));
    // We create a new V8 context with our globals
    var ctx = vm.createContext(glob);
    // We evaluate the `vm.Script` in the new context
    var output = script.runInContext(ctx);
    // We pull the local `instance` variable out, to use as our proxy object
    this.sandbox = ctx.instance;
    this.sandbox.init(events);

    return this;
  }

  timelineModel() {
    return this.sandbox.timelineModel();
  }

  tracingModel() {
    return this.sandbox.tracingModel();
  }

  topDown() {
    return this.sandbox.topDown();
  }

  bottomUp() {
    return this.sandbox.bottomUp();
  }

  /**
   * @ param  {!String} grouping Allowed values: None Category Subdomain Domain URL Name
   * @ return {!WebInspector.TimelineProfileTree.Node} A grouped and sorted tree
   */
  bottomUpGroupBy(grouping) {
    return this.sandbox.bottomUpGroupBy(grouping);
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
