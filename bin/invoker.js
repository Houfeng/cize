const starter = require('./starter');
const console = require('console3');

const EXIT_DELAY = 1000;

module.exports = function (cmdline) {

  //初始化启动器
  starter.init(cmdline);

  //当发生错误时退出
  function exitWhenError(err) {
    console.error(err);
    process.exit(1);
  }

  //禁止 webServer
  starter.server.config({
    webServer: false
  });

  //重用 worker 逻辑
  starter.start(function (err) {
    if (err) return exitWhenError(err);
    starter.server.invoke(
      cmdline.options.project,
      cmdline.options.job,
      cmdline.options.params,
      //执行完成时
      function (err) {
        if (err) return exitWhenError(err);
        console.log('Execute is successful');
        setTimeout(function () {
          process.exit(0);
        }, EXIT_DELAY);
      },
      //调用状态
      function (status) {
        if (!status) return exitWhenError('Invoke is failed');
        console.log('Invoke is successful');
        console.log('Running...');
      });
  });

};