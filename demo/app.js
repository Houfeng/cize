var ci = require('../');

ci.init({
  workspace: '/Users/Houfeng/Desktop/cix-root',
  port: 8090
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/houfeng/cix.git'
});

demo1.job('pull', ci.series(function (done) {
  console.log1('pull1');
  done();
}, ci.shell(function () {
  /*
  ping www.baidu.com 
  */
})));

demo1.job('build', ci.on(['pull'], function (done) {
  this.console.log('build');
  console.log('build');
  done();
}));

ci.start(function () {
  demo1.invoke('pull', function (err, job) {
    if (err) throw err;
  });
});
