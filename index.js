/* global WebInspector TimelineModelTreeView */
'use strict';

//require('mock-globals') // nope. doesn't sandbox Natives
// var Sandbox = require('sandbox'); // nope. doesn't have a global obj
// vm.createContext // nope. doesnt have global.
var fs = require('fs');
var vm = require('vm')


var WebInspector = {}
class TraceToTimelineModel {

  constructor(events) {

    var glob = { require: require, global: global, console: console, process, process, __dirname: __dirname }
    const script  = new vm.Script(fs.readFileSync(__dirname + "/lib/api-stubs.js", 'utf8'))
    var ctx = vm.createContext(glob);
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

module.exports = TraceToTimelineModel
