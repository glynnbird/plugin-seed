'use strict';

var utils = require('pouchdb-utils'),
   PouchDB = require('pouchdb');

exports.sayHello = utils.toPromise(function (callback) {
  callback(null, 'hello');
});

exports.pull = utils.toPromise(function(remote) {

  if (typeof remote === 'string') {
    remote = new PouchDB(remote);
  }

  var target = this;
  var dbName = 'envoytemp' + new Date().getTime();

  // create a temporary PouchDB database
  var temp = new PouchDB(dbName);

  // pull all docs from the remote (not the bodies)
  return remote.allDocs().then(function(response) {
    
    // use revsdiff to find difference with local copy
    var diffs = {};
    response.rows.forEach(function(row) {
      diffs[row.id]= [ row.value.rev ];
    });
    return target.revsDiff(diffs);
  }).then(function(response) {

    // no need to do anything
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
  }).then(function() {
    return temp.destroy();
  }).catch(function(e) {
    console.error('pouchdb-envoy: ',e);
    temp.destroy();
  });
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
