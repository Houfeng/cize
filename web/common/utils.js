const utils = nokit.utils;
utils.pkg = require('../../package.json');
const Convert = require('ansi-to-html-umd');

const convert = new Convert({
  fg: '#333',
  bg: '#fff'
});

utils.statusIcons = {
  "300": "fa-exclamation-circle",
  "200": "fa-check-circle",
  "100": "fa-spinner fa-spin fa-fw"
};

utils.ansiToHtml = function (data) {
  if (!data) return data;
  data = data.toString();
  return convert.toHtml(data.replace(/\[2K\[0G/igm, ''));
}

module.exports = utils; 