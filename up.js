/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, posixPipe = require('posix-pipe'), fs = require('fs'),
  Socket = require('net').Socket, hndProp = '_handle';


function isNum(x, no) { return ((x === +x) || no); }
function fail(why) { throw new Error(why); }
function noOp() { return; }
function concatIf(a, x) { return (x ? a.concat(x) : a); }
function bindArrgs(f, o, a) { return f.bind.apply(f, concatIf([o], a)); }
function isStr(x, no) { return (((typeof x) === 'string') || no); }
function str2mthd(x, o, a) { return (isStr(x) ? bindArrgs(o[x], o, a) : x); }


EX = function pipe() {
  var p = EX.aliasify(posixPipe());
  p.forEach(function (s) { s.fd = s[hndProp].fd; });
  return p;
};


EX.aliasify = function (p) {
  p.output  = p.o = p.r = p.rd = p[0];
  p.input   = p.i = p.w = p.wr = p[1];
  return p;
};


EX.justFds = function pipe() { return EX.aliasify(posixPipe.pipe()); };

function oneStreamDiscardFd(side) {
  var stm = this, fdNum = null;
  if (side === 'ours') { fdNum = stm.fd; }
  if (side === 'peer') { fdNum = stm.peerFd; }
  if (fdNum === null) { throw new Error('Bad socket side name: ' + side); }
  if (!isNum(fdNum)) { throw new Error('Bad fd on socket side ' + side); }
  fs.close(fdNum, function whenDiscarded(err) {
    // None of the errors are important: According to man 2 close,
    // close(2) can have just these errors:
    // EBADF = invalid file descriptor = nothing to discard = instant success.
    // EINTR = interrupted by a signal. should be node's problem, not ours.
    // EIO = potential loss of unwritten data. yeah. it's called "discard".
    stm.emit('discardFd', err, { side: side, fdNum: fdNum });
    stm.emit('discardFd:' + side, err, { side: side, fdNum: fdNum });
  });
}


EX.oneStream = function (intendedStreamMode, opt) {
  opt = (opt || false);
  var sides = EX.oneStream.sides(intendedStreamMode), stm, fds;
  fds = EX.justFds();
  stm = new Socket({
    fd: fds[sides.ours],
    allowHalfOpen: true,
    readable: (sides.ours === 'rd'),
    writable: (sides.ours === 'wr'),
  });
  stm.discardFd = oneStreamDiscardFd;
  fds.ours = fds[sides.ours];
  stm.fd = fds.ours;

  fds.peer = fds[sides.peer];
  stm.peer = {
    fd: fds.peer,
    readable: (sides.peer === 'rd'),
    writable: (sides.peer === 'wr'),
  };
  stm.peerFd = fds.peer;

  if (!opt.keepPeerFd) {
    // As soon as the peer has picked up, usually there's no longer
    // a reason for us to hold onto the peerFd.
    stm.once('resume', function discardPeerFd() { stm.discardFd('peer'); });
  }

  return stm;
};

(function () {
  var otherSide = { rd: 'wr', wr: 'rd' }, aliases = { r: 'rd', w: 'wr' };
  EX.oneStream.sides = function (ism) {
    ism = (aliases[ism] || ism);
    var oth = otherSide[ism];
    if (!oth) { fail('intendedStreamMode must be "r", "rd", "w", or "wr".'); }
    return { ours: ism, peer: oth };
  };
}());



















module.exports = EX;
