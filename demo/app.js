var ci = require('../');

ci.config({
  workspace: __dirname,
  port: 8090,
  secret: '12345',
});

var demo1 = ci.project('demo1', {
  repertory: 'https://github.com/nokitjs/nokit.git'
});

demo1.job('pull', ci.shell(function () {
  /*
  #git clone https://github.com/nokitjs/nokit.git ./
  #npm i
  #echo pull
  */
}));

demo1.job('build', ci.by(['pull'], ci.shell(function () {
  /*
  nokit xxx
  npm test
  */
})));

demo1.job('test', ci.shell(function () {
  /*
  nokit test
  ping baidu.com
  */
})).beforeRun(function (job) {
  return false;
});

demo1.job('s', ci.parallel([
  function (self) {
    self.done(new Error('1'));
  },
  function (self) {
    self.done(new Error('2'));
  }
]))

//demo1.job('cron', ci.cron('*/2 * * * * *', 'build'));

ci.start();