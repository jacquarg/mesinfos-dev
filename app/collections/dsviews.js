var DSView = require('models/dsview');

module.exports = Backbone.Collection.extend({
  model: DSView,

  sync: function(method, collection, options) {
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }

      return;
    }

    var docType = new this.model().docType.toLowerCase();

    cozy.client.data.defineIndex(docType, ['_id'])
    .then(function(index) {
      return cozy.client.data.query(index, { selector: { _id: '' }});
    })
    .then(options.success, options.error);
  },

});
