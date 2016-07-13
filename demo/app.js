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
  this.console.error('1');
  this.done(new Error(0));
}, function () {
  this.console.error('2');
  this.done();
}));


ci.start();