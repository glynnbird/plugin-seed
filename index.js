'use strict';

var utils = require('pouchdb-utils');
var PouchDB = require('PouchDB');


exports.sayHello = utils.toPromise(function (callback) {
  //
  // You can use the following code to
  // get the pouch or PouchDB objects
  //
  // var pouch = this;
  // var PouchDB = pouch.constructor;

  callback(null, 'hello');
});

exports.pull = utils.toPromise(function(remote) {
  
  if (remote.adapter !== 'http') {
    throw('remote PouchDB must be http');
  }
  var target = this;
  var replication_info = null;

  // create a temporary PouchDB database
  var temp = new PouchDB('envoytemp');
  // empty it
  return temp.destroy().then(function() {
    // then recreate it
    temp = new PouchDB('envoytemp');    
    // pull all docs from the remote (not the bodies)
    return remote.allDocs();
  }).then(function(response) {
    // use revsdiff to find difference with local copy
    var diffs = {};
    response.rows.forEach(function(row) {
      diffs[row.id]= [ row.value.rev ];
    });
    return target.revsDiff(diffs);
  }).then(function(response) {
    // fetch everything about document ids of interest
    var docs = [];
    Object.keys(response).map(function(id) {
      docs.push({id: id});
    });
    return remote.bulkGet({docs: docs, revs:true});
  }).then(function(response) { 
    // push the changed docs to tempdb
    var docs = [];
    response.results.forEach(function(row) {
      row.docs.forEach(function(d) {
        docs.push(d.ok);
      });
    });
    return temp.bulkDocs(docs, {new_edits: false});
  }).then(function() {
    // replicate from temp DB to actual target
    return target.replicate.from(temp);
  }).then(function(info) {
    replication_info = info;
    return temp.destroy();
  }).then(function() {
    return replication_info;
  });
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
