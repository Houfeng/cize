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
  git clone https://github.com/nokitjs/nokit.git ./
  npm i
  */
}));

demo1.job('build', ci.by(['pull'], ci.shell(function () {
  /*
  npm test
  */
})));

demo1.job('test', ci.shell(function () {
  /*
  nokit test
  ping baidu.com
  */
}));

//demo1.job('cron', ci.cron('*/10 * * * * *', 'pull'));

ci.start();

// var exitHook = require('exit-hook');
 
// exitHook(function () {
// 	console.log('exiting',process.pid);
// });

// throw 0

// process.exit(0);