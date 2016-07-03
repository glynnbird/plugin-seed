/*jshint expr:true */
'use strict';

var PouchDB = require('pouchdb');

//
// your plugin goes here
//
var thePlugin = require('../');
PouchDB.plugin(thePlugin);
var assert = require('assert');

describe('pouchdb-envoy', function() {

  var dbName = 'testdb' + Math.random();
  var db;
  var remote;

  before(function () {
    db = new PouchDB(dbName);
    remote = new PouchDB(dbName+'remote');
    var docs = [];
    for(var i = 0 ; i < 50 ; i++) {
      var doc = { _id: ''+i, a: i, b: i*10};
      docs.push(doc);
    }
    return remote.bulkDocs(docs);
  });

  after(function () {
    return remote.destroy().then(function() {
      return db.destroy();
    });
  });

  it('pull should fetch all documents', function() {
    return db.pull(remote).then(function() {
      return db.allDocs({include_docs:true});
    }).then(function(data) {
      assert.equal(typeof data, 'object');
      assert.equal(data.rows.length, 50);
      for(var i in data.rows) {
        var doc = data.rows[i].doc;
        assert.equal(parseInt(doc._id,10), doc.a);
        assert.equal(doc.b, doc.a*10);
      }
    }); 
  });

  it('check new edits arrive', function() {
    var id = '0';
    return remote.get(id).then(function(doc) {
      doc.c = 'changed';
      return remote.put(doc);
    }).then(function() {
      return db.pull(remote);
    }).then(function() {
      return db.get(id);
    }).then(function(doc) {
      assert.equal(typeof doc.c, 'string');
      assert.equal(doc.c, 'changed');
      return db.allDocs({include_docs:true});
    }).then(function(data) {
      assert.equal(typeof data, 'object');
      assert.equal(data.rows.length, 50);
      for(var i in data.rows) {
        var doc = data.rows[i].doc;
        assert.equal(parseInt(doc._id,10), doc.a);
        assert.equal(doc.b, doc.a*10);
      }
    });
  });

  it('check local edits survive remote edits as a conflict', function() {
    var id = '1';
    return remote.get(id).then(function(doc) {
      doc.c = 'changed';
      return remote.put(doc);
    }).then(function() {
      return db.get(id);
    }).then(function(doc) {
      doc.c = 'locallychanged';
      return db.put(doc);
    }).then(function() {
      return db.pull(remote);
    }).then(function() {
      return db.get(id,{conflicts:true});
    }).then(function(doc) {
      assert.equal(typeof doc.c, 'string');
      assert.equal(typeof doc._conflicts, 'object');
      assert.equal(doc._conflicts.length, 1);
      return db.allDocs({include_docs:true});
    }).then(function(data) {
      assert.equal(typeof data, 'object');
      assert.equal(data.rows.length, 50);
      for(var i in data.rows) {
        var doc = data.rows[i].doc;
        assert.equal(parseInt(doc._id,10), doc.a);
        assert.equal(doc.b, doc.a*10);
      }
    });
  });

  it('check two pulls in a row without changes', function() {
    return db.pull(remote).then(function() {
      return db.allDocs();
    }).then(function(allDocs) {
      assert.equal(typeof allDocs.rows, 'object');
      assert.equal(allDocs.rows.length, 50);
      return db.pull(remote);
    }).then(function() {
      return db.allDocs();
    }).then(function(allDocs) {
      assert.equal(typeof allDocs.rows, 'object');
      assert.equal(allDocs.rows.length, 50);
    });
  });

  // we know that in this algorithm, remote deletes don't 
  // get propagated to the local device 
  it('check remote deletes do not work', function() {
    var id = '1';
    return remote.get(id).then(function(doc) {
      return remote.remove(doc);
    }).then(function() {
      return db.pull(remote);
    }).then(function() {
      return db.allDocs({include_docs:true});
    }).then(function(data) {
      assert.equal(typeof data, 'object');
      // in an ideal world, this would by 49, but we
      // know that the pull method doesn't propogate deletes
      assert.equal(data.rows.length, 50);
    });
  });

});
