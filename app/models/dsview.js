var appName = require('lib/utils').appNameNVersion;

module.exports = Backbone.Model.extend({
  docType: 'DSView',

  defaults: {
    docTypeVersion: appName(),
  },
  initialize: function() {
  },

  getDocType: function() {
    return this.get('docTypeOfView');
  },

  getName: function() {
    return this.get('name');
  },

  getMapFunction: function() {
    return this.get('mapFunction');
  },

  getQueryParams: function() {
    return this.get('queryParams');
  },

  updateDSView: function() {
    var self = this;
    return cozysdk.defineView(this.getDocType(),
      this.getName(),
      this.getMapFunction()).then(function(err) {
        cozysdk.run(self.getDocType(), self.getName(), { limit: 1 });
      });
  },

  parse: function(raw) {
    raw.id = raw._id;
    return raw;
  },

  sync: function(method, model, options) {
    var callback = function(err, res) {
      if (err) { return options.error(err); }
      options.success(res);
    }

    if (method === 'create') {
      return cozysdk.create('DSView', model.attributes, callback);
    } else if (method === 'update' || method === 'patch') {
      return cozysdk.updateAttributes('DSView', model.attributes._id, model.attributes, callback);
    } else if (method === 'delete') {
      return cozysdk.destroy('DSView', model.attributes._id, callback);
    } else if (method === 'read') {
      return cozysdk.find('DSView', model.attributes._id, callback);
    }
  }
});
