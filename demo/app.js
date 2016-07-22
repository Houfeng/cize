var ci = require('../');

ci.config({
  workspace: __dirname,
  port: 8090,
  secret: '12345',
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/nokitjs/nokit.git'
});

demo1.job('test', ci.parallel(function () {
  this.done(new Error(1));
}, function () {
  this.done(new Error(2));
}));

demo1.job('shell', ci.shell(function () {
  /*
  ping www.baidu.com
  */
}));

ci.start();