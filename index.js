'use strict';

var utils = require('pouchdb-utils'),
   PouchDB = require('pouchdb');

exports.pull = utils.toPromise(function(remote) {

  // sanity check 
  if (!remote) {
    throw('remote must be a PouchDB instance or a url');
  }

  // if this is a url
  if (typeof remote === 'string') {
    remote = new PouchDB(remote);
  }

  // keep a reference for 'this'
  var target = this;

  // create temporary database
  var dbName = 'envoytemp' + new Date().getTime();
  var temp = new PouchDB(dbName);
  var summary = null;

  // pull all docs from the remote (not the bodies)
  return remote.allDocs().then(function(response) {

    // use revsdiff to find difference with local copy
    var diffs = {};
    response.rows.forEach(function(row) {
      diffs[row.id]= [ row.value.rev ];
    });
    return target.revsDiff(diffs);
  }).then(function(response) {

    // if there are no differences, no need to do anything
    if (Object.keys(response).length === 0) {
      throw('no changes');
    }

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
  }).then(function(repl) {
    // stash the replication summary
    summary = repl;
    // remove temporary database
    return temp.destroy();
  }).then(function() {
    return summary;
  }).catch(function(e) {
    console.error('pouchdb-envoy: ', e);
    temp.destroy();
  });
});

// push is an alias for 'replicate.to'
exports.push = utils.toPromise(function(remote) {
  var target = this;
  return target.replicate.to(remote);
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
