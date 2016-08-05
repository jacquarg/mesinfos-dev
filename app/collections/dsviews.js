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
    // View all is automatically defined !
    cozysdk.run(docType, 'all', { include_docs: true }, function(err, results) {
      if (err) { return options.error(err); }

      return options.success(results.map(function(res) { return res.doc; }));
    });
  },
});
