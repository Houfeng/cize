var ci = require('../');

ci.init({
  workspace: '/Users/Houfeng/Desktop/cize-root',
  port: 8090,
  secret: '12345',
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/houfeng/cize.git'
});

demo1.job('pull', ci.series(function (done) {
  this.console.log('pull1');
  done();
}, ci.shell(function () {
  /*
  echo $PWD
  lss
  */
})));

demo1.job('build', ci.on(['pull'], function (done) {
  this.console.log('build');
  console.log('build');
  done();
}));

ci.start();
