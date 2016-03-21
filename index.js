/* global WebInspector TimelineModelTreeView */
'use strict';

var fs = require('fs');
var vm = require('vm')

class ModelAPI {

  constructor(events) {

    // Everything happens in a sandboxed vm context, to keep globals and natives separate.
    var glob = { require: require, global: global, console: console, process, process, __dirname: __dirname }
    var script  = new vm.Script(fs.readFileSync(__dirname + "/lib/timeline-model.js", 'utf8'))
    var ctx = vm.createContext(glob)
    var output = script.runInContext(ctx)

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

  // @ returns a grouped and sorted tree
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

module.exports = ModelAPI
