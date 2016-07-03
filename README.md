PouchDB Plugin - pouchdb-envoy
=====

[![Build Status](https://travis-ci.org/pouchdb/plugin-seed.svg)](https://travis-ci.org/pouchdb/plugin-seed)

A custom replicator for use with [Cloudant Envoy](https://github.com/cloudant-labs/envoy). Instead of doing:

```js
  var PouchDB = require('pouchdb');
  var local = new PouchDB("local");
  local.replicate.from('http://username:password@my.domain.name.com/dbname');
```

do

```js
  var PouchDB = require('pouchdb');
  PouchDB.plugin(require('pouchdb-envoy'));
  var local = new PouchDB('local');
  var remote = new PouchDB('http://username:password@my.domain.name.com/dbname');
  local.pull(remote);
```

or

```js
  local.pull('http://username:password@my.domain.name.com/dbname');
```

To push data up to the server, you can do:

```js
  local.push(remote);
```

or

```js
  local.push('http://username:password@my.domain.name.com/dbname');
```

Building
----
    npm install
    npm run build

Your plugin is now located at `dist/pouchdb.pouchdb-envoy.js` and `dist/pouchdb.pouchdb-envoy.min.js` and is ready for distribution.


Testing
----

### In Node

This will run the tests in Node using LevelDB:

    npm test
    
You can also check for 100% code coverage using:

    npm run coverage

If you don't like the coverage results, change the values from 100 to something else in `package.json`, or add `/*istanbul ignore */` comments.


If you have mocha installed globally you can run single test with:
```
TEST_DB=local mocha --reporter spec --grep search_phrase
```

The `TEST_DB` environment variable specifies the database that PouchDB should use (see `package.json`).

### In the browser

Run `npm run dev` and then point your favorite browser to [http://127.0.0.1:8001/test/index.html](http://127.0.0.1:8001/test/index.html).

The query param `?grep=mysearch` will search for tests matching `mysearch`.

### Automated browser tests

You can run e.g.

    CLIENT=selenium:firefox npm test
    CLIENT=selenium:phantomjs npm test

This will run the tests automatically and the process will exit with a 0 or a 1 when it's done. Firefox uses IndexedDB, and PhantomJS uses WebSQL.

What to tell your users
--------

Below is some boilerplate you can use for when you want a real README for your users.

To use this plugin, include it after `pouchdb.js` in your HTML page:

```html
<script src="pouchdb.js"></script>
<script src="pouchdb.envoy.js"></script>
```

Or to use it in Node.js, just npm install it:

```
npm install pouchdb-envoy
```

And then attach it to the `PouchDB` object:

```js
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-envoy'));
```
