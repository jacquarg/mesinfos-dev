var DSView = require('models/dsview');
var utils = require('lib/utils');


module.exports = DSView.extend({

  getDocType: function() {
    return this.get('DocType');
  },

  getName: function() {
    return utils.slugify(this.get('Nom'));
  },

  getMapFunction: function() {
    console.log('right here::');
    return utils.test2MapFunction(this.get('Format'));
  }

});
