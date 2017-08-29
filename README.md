
<!--#echo json="package.json" key="name" underline="=" -->
unix-pipe
=========
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Alternate interface to the posix-pipe package. Maybe some day I&#39;ll add a
fallback for compatibility with other operating systems.
<!--/#echo -->


Usage
-----

from [test.usage.js](test/usage.js):

<!--#include file="test.usage.js" start="  //#u" stop="  //#r"
  outdent="  " code="javascript" -->
<!--#verbatim lncnt="26" -->
```javascript
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
```
<!--/include-->


<!--#toc stop="scan" -->



Known issues
------------

* needs more/better tests and docs




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
