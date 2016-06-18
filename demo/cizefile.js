module.exports = function (ci) {

  ci.init({
    workspace: '/Users/Houfeng/Desktop/cize-root',
    port: 8090,
    secret: '12345',
  });

  var demo1 = ci.project('demo1', {
    repertory: 'https://github.com/nokitjs/nokit.git'
  });

  demo1.job('pull', ci.shell(function () {
    /*
    git clone ${project.options.repertory} ./
    */
  }));

  demo1.job('build', ci.on(['pull'], ci.shell(function () {
    /*
    npm install
    npm test
    */
  })));

};