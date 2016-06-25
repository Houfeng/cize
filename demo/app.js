var ci = require('../');

ci.init({
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

//demo1.job('cron', ci.cron('*/10 * * * * *', 'pull'));

ci.start();