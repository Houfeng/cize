var ci = require('../');

ci.init({
  workspace: '/Users/Houfeng/Desktop/cix-root',
  port: 8090
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', ci.series(function (done) {
  this.console.log1('pull1');
  console.log('pull1');
  done();
}, function (done) {
  this.console.log('pull2');
  console.log('pull2');
  done();
}));

demo1.job('build', ci.on(['pull'], function (done) {
  this.console.log('build');
  console.log('build');
  done();
}));

ci.start(function () {
  demo1.invoke('pull', function (err, job) {
    throw new Error('e2');
  });
});
