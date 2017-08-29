/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var equal = require('equal-pmb'), async = require('async');


(function readmeDemo() {
  //#u
  var unixPipe = require('unix-pipe'), coll = require('collect-stream'),
    portal = unixPipe(), wormhole = unixPipe();

  equal(typeof portal.rd.fd, 'number');
  equal(typeof portal.wr.fd, 'number');
  portal.wr.write('There will be cake!\n');

  equal(typeof wormhole.output.fd, 'number');
  equal(typeof wormhole.input.fd, 'number');
  wormhole.input.write('omnom\n');

  setTimeout(function () {
    portal.wr.end();
    wormhole.wr.end();
  }, 50);

  async.map([ portal.rd, wormhole.output ], coll, function verify(err, stuff) {
    equal(err, null);
    equal(stuff.map(String), [
      'There will be cake!\n',
      'omnom\n',
    ]);
    console.log("+OK usage test passed.");
  });
  //#r
}());









//= "+OK usage test passed."
