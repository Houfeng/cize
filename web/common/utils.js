const utils = nokit.utils;
utils.pkg = require('../../package.json');

utils.statusIcons = {
  "300": "fa-exclamation-circle",
  "200": "fa-check-circle",
  "100": "fa-spinner fa-spin fa-fw"
};

module.exports = utils; 