'use-strict'

const DSView = require('models/dsview')
const utils = require('lib/utils')
var ap = require('lib/asyncpromise')

module.exports = DSView.extend({
  getDocType: function() {
    return this.get('cozyDoctypeName');
  },

  getName: function() {
    return utils.slugify(this.get('name'));
  },

  getIndexFields: function() {
    return JSON.parse(this.get('cozyIndex'));
  },

  getQueryParams: function() {
    return {
      selector: JSON.parse(this.get('cozySelector')),
      limit: 10
    };
  },

  // Readonly!
  save: function(options) {
    return options.success();
  },

  // Manage synth set
  synthSetAvailable: function() {
    var setName = this.getSynthSetName();
    return setName && setName !== '' ;
  },

  getSynthSetName: function(){
    // We assume her ethat syntheticet is a url like that :
    //  "https://raw.githubusercontent.com/jacquarg/mesinfos-dev3/master/data/consommation_electrique.json"
    return this.has('syntheticSet') ? this.get('syntheticSet').slice(63) : undefined;
  },

  insertSynthSet: function() {
    var displayId = 'insertsynthset';
    var self = this;
    if (!this.synthSetAvailable()) { return Promise.resolve(false); }
    return Promise.resolve($.getJSON(self.getSynthSetName()))
    .then(function(raw) {
      var count = raw.length;
      return ap.series(raw, function(doc, index) {
        app.trigger('message:display', displayId, 'Ajout de documents '
         + self.getDocType() + ' de synthèse ' + index + '/' + count);
        return self._insertOneSynthDoc(doc);
      });
    })
    .then(function(ids) {
      ids = ids.map(function(obj) { return obj._id; });
      app.trigger('message:display', displayId, 'Mise à jour des paramètres');
      return app.properties.addSynthSetIds(self.getSynthSetName(), ids);
    })
    .then(function() {
      app.trigger('message:hide', displayId);
      self.trigger('synthsetInserted');
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error while processing data. Retry or check console.');
    });

  },

  _insertOneSynthDoc: function(row) {
    delete row._id;
    delete row.id;
    delete row._rev;
    delete row.docType;
    return cozy.client.data.create(this.getDocType(), row);
  },

  cleanSynthSet: function() {
    var displayId = 'deletesynthset';
    var self = this;

    var count = self.get('synthSetIds').length;

    return ap.series(self.get('synthSetIds'), function(id, index) {
        app.trigger('message:display', displayId, 'Suppression des documents '
         + self.getDocType() + ' de synthèse ' + index + '/' + count);
        return cozy.client.data.find(self.getDocType(), id)
        .then(function(doc) {
          return cozy.client.data.delete(self.getDocType(), doc);
        });
    })
    .then(function() {
      app.trigger('message:display', displayId, 'Màj des paramètres');
      self.unset('synthSetIds');
      return app.properties.cleanSynthSetIds(self.getSynthSetName());
    })
    .then(function() {
      app.trigger('message:hide', displayId);
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Erreur pendant la suppression de données de synthèse. Réessayer, ou consultez la console pour en savoir plus.')
    });

    // return Promise.all(self.get('synthSetIds').map(
    //   function(id) { return cozysdk.destroy(self.getDocType(), id); })
    // )

  },

  synthSetInDS: function() {
    return this.has('synthSetIds');
  },

});
