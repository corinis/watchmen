var glob = require('glob');
var path = require('path');

exports = module.exports = (function(){

  var PREFIX_PING_PLUGIN = 'watchmen-plugin-';
  var pkgJson = require(path.resolve(__dirname, '../package.json'));

  return {

    /**
     * Load plugins from node_modules
     * @param watchmen
     * @param cb
     */

    loadPlugins : function (watchmen, options, cb) {
      console.log('\nloading plugins from nodemodules... '.gray);
      for (var dep in pkgJson.dependencies) {
        if (dep.indexOf(PREFIX_PING_PLUGIN) === 0){
          new require(dep)(watchmen);
        }
      }
      console.log('\nloading plugins locally... ');
      var lmods = glob.sync("./plugins/"+PREFIX_PING_PLUGIN+"*.js");
      lmods.forEach(function(lmod){
	 lmod = lmod.substring(0, lmod.length-3)
         new require("." + lmod)(watchmen);
      });
      cb();
    }
  };

})();
