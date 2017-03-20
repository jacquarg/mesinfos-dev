var CozyModel = require('../lib/backbone_cozymodel');
var utils = require('../lib/utils');

module.exports = CozyModel.extend({
  docType: 'org.fing.mesinfos.mesinfos-dev.dsview',

  // getQualifiedDocType: function() {
  //   return 'org.fing.mesinfos.mesinfos-dev.' + this.getDocType();
  // },

  getDocType: function() {
    return this.get('docTypeOfView');
  },

  getName: function() {
    return this.getDocType() + '_' + this.getIndexFields().join('_');
  },

  getIndexFields: function() {
    // TODO : handle doctype version / migration ?
    var fields = this.get('indexFields');
    return Array.isArray(fields) ? fields : [];
  },

  getQueryParams: function() {
    return this.get('queryParams');
  },

  updateDSView: function() {
    var app = require('application');
    var displayId = 'updateDSView';
    var self = this;
    var start = Date.now();
    app.trigger('message:display', displayId, 'defineView ' + self.getName());

    return cozy.client.data.defineIndex(this.getDocType(), this.getIndexFields())
    .then(function(index) {
      self.index = index;

      app.trigger('message:display', displayId, 'initialize ' + self.getName());
      // this is just an prefetch (real query done in collections/documents.)
      cozy.client.data.query(self.index, self.getQueryParams());
      })
    .then(function() {
      app.trigger('message:display', displayId, self.getName() + ' màj en '
       + (Date.now() - start) / 1000 + 's.');
    })
    .catch(utils.generateDisplayError(
      'Erreur pendant updateView ' + self.getName()));
  },
});
