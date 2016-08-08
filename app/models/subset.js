var DSView = require('models/dsview');
var utils = require('lib/utils');


module.exports = DSView.extend({
  type: 'Subset',
  getDocType: function() {
    return this.get('DocType');
  },

  getName: function() {
    return utils.slugify(this.get('Nom'));
  },

  getMapFunction: function() {
    return utils.test2MapFunction(this.get('Format'));
  },

  // Readonly!
  save: function(options) {
    return options.success();
  },
});
