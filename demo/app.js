var ci = require('../');

require('./cizefile');

ci.config({
  configFile: require.resolve('./cizefile')
})

ci.start();