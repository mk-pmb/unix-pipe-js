/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, posixPipe = require('posix-pipe'), hndProp = '_handle';


EX = function pipe() {
  //#d
  var p = posixPipe();
  p.forEach(function (s) { s.fd = s[hndProp].fd; });
  p.output  = p.o = p.rd = p[0];
  p.input   = p.i = p.wr = p[1];
  return p;
  //#e
};








module.exports = EX;
