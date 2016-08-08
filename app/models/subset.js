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
    return utils.test2MapFunction(this.get('Format'));
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
    return this.get('Exemple');
  },
  insertSynthSet: function() {
    var self = this;
    if (!this.synthSetAvailable()) { return Promise.resolve(false); }

    return Promise.resolve($.getJSON('data/'+ self.getSynthSetName() +'.json'))
    .then(function(raw) {
      return Promise.all(raw.map(self._insertOneSynthDoc, self));
    }).then(function(ids) {
      ids = ids.map(function(obj) { return obj._id; });
      var app = require('application');
      return app.properties.addSynthSetIds(self.getSynthSetName(), ids)
    });
    //.catch ??;

  },

  _insertOneSynthDoc: function(row) {
    delete row._id;
    delete row.id;
    return cozysdk.create(this.getDocType(), row);
  },

  cleanSynthSet: function() {
    var self = this;
    return Promise.all(self.get('synthSetIds').map(
      function(id) { return cozysdk.destroy(self.getDocType(), id); })
    ).then(console.log).catch(console.log).then(function(res) {
      var app = require('application');
      app.properties.cleanSynthSetIds(self.getSynthSetName());
    });
  },

  synthSetInDS: function() {
    return this.has('synthSetIds');
  },



});
