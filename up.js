/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, posixPipe = require('posix-pipe'), fs = require('fs'),
  Socket = require('net').Socket, hndProp = '_handle';


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


EX.oneStream = function (streamSide, opt) {
  opt = (opt || false);
  var stm = streamSide, rawSide, fds, whenDiscarded;
  if (stm === 'r') { stm = 'rd'; }
  if (stm === 'rd') { rawSide = 'wr'; }
  if (stm === 'w') { stm = 'wr'; }
  if (stm === 'wr') { rawSide = 'rd'; }
  if (!rawSide) { fail('streamSide must be "r", "rd", "w", or "wr".'); }
  fds = EX.justFds();
  stm = new Socket({
    fd: fds[streamSide],
    allowHalfOpen: true,
    readable: (streamSide === 'rd'),
    writable: (streamSide === 'wr'),
  });
  stm.fd = fds[streamSide];
  stm.peerFd = fds[rawSide];
  stm.peer = { fd: stm.peerFd,
    readable: (rawSide === 'rd'),
    writable: (rawSide === 'wr'),
    };

  whenDiscarded = str2mthd((opt.whenDiscarded || noOp), console,
    ['Discarded FD:', stm.peerFd, 'error?:']);
  function discardPeerFd() {
    fs.close(stm.peerFd, whenDiscarded);
    // close(2) (man 2 close) can have errors EBADF, EINTR and EIO.
    // EBADF = invalid file descriptor = nothing to discard = instant success.
    // EINTR = interrupted by a signal. should be node's problem, not ours.
    // EIO = potential loss of unwritten data. yeah. it's called "discard".
  }
  if (stm.writable) {
    stm.closeDiscardUnwrittenData = discardPeerFd;
  } else {
    // If it isn't writable in the first place, we can be reasonably sure
    // the user won't care about whether any potentially written data
    // (however they managed to do so) might be discaded, so we can
    // expose it as just .end() without the disclaimer:
    stm.end = discardPeerFd;
  }

  return stm;
};


















module.exports = EX;
