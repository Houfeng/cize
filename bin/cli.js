#!/usr/bin/env node

const path = require('path');
const CmdLine = require('cmdline');
const cluster = require('cluster');
const ci = require('../');
const pkg = ci.pkg;
const master = require('./master');
const worker = require('./worker');

const cmdline = new CmdLine();

cmdline.NAME = pkg.name;
cmdline.VERSION = pkg.version;
cmdline.CONFIG_FILE_NAME = `${pkg.name}file.js`;
cmdline.CONFIG_FILE_REGEXP = /\.js$/i;

//计算 confPath
cmdline.configFile = path.resolve(process.cwd(), cmdline.args[0] || './');
if (!cmdline.CONFIG_FILE_REGEXP.test(cmdline.configFile)) {
  cmdline.configFile = path.normalize(`${cmdline.configFile}/${cmdline.CONFIG_FILE_NAME}`);
}

if (cluster.isMaster) {
  master(cmdline);
} else {
  worker(cmdline);
}