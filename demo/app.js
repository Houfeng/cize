var ci = require('../');

ci.config({
  workspace: __dirname,
  port: 8090,
  secret: '12345',
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/nokitjs/nokit.git'
});

demo1.job('test', ci.series([ci.shell(function () {
  /*
  echo test
  */
})]));


ci.start();