#!/usr/bin/env node

const path = require('path');
const CmdLine = require('cmdline');
const cluster = require('cluster');
const pkg = require('../package.json');
const os = require('os');
const fs = require('fs');
const console = require('console3');
const stp = require('stp');
const cmdline = require('cmdline');

cmdline.NAME = pkg.name;
cmdline.VERSION = pkg.version;
cmdline.CONFIG_FILE_NAME = `${pkg.name}file.js`;
cmdline.CONFIG_FILE_REGEXP = /\.js$/i;

if (cluster.isMaster) {
  cmdline.HELP_INFO = stp(fs.readFileSync(path.normalize(`${__dirname}/help.txt`)).toString(), {
    cmd: cmdline.NAME,
    conf: cmdline.CONFIG_FILE_NAME
  }) + os.EOL;
}

cmdline
  .error(function (err) {
    console.error(err.message);
  })
  .version(`${cmdline.NAME.toUpperCase()} ${cmdline.VERSION}`)
  .help(cmdline.HELP_INFO)
  .option(['-p', '--port'], 'number')
  .option(['-s', '--secret'], 'string')
  .option(['-w', '--worker'], 'number')
  .option(['-m', '--mode'], 'string')
  .option('--project', 'string')
  .option('--job', 'string')
  .option('--params', 'string*')
  .action({ options: ['--project', '--job'] }, function (project, job) {
    require('./invoker')(cmdline);
    return false;
  })
  .action(function ($1) {
    //计算 confPath
    cmdline.configFile = path.resolve(process.cwd(), $1 || './');
    if (!cmdline.CONFIG_FILE_REGEXP.test(cmdline.configFile)) {
      cmdline.configFile = path.normalize(`${cmdline.configFile}/${cmdline.CONFIG_FILE_NAME}`);
    }
    require(cluster.isMaster ? './master' : './worker')(cmdline);
    return false;
  }, false)
  .ready();