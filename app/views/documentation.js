var app = undefined;


module.exports = Mn.ItemView.extend({
  tagName: 'div',
  template: require('views/templates/documentation'),

  events: {
    'click .insert': 'insertSynthSet',
  },

  behaviors: {
    Destroy: { onDestroy: 'destroySynthSet'},
  },

  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.setModel);
  },

  setModel: function(model) {
    this.model = model;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    // Test here if model is not null ; and model is a subset.
    if (this.model && this.model.synthSetAvailable) {
      data = this.model.toJSON();
      data.synthSetInsertable = this.model.synthSetAvailable();
      data.synthSetInDS = this.model.synthSetInDS();
      data.docType = app.docTypes.findWhere({ 'Nom': this.model.getDocType()}).toJSON();
      data.subsets = app.subsets.where({'DocType': this.model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
    }
    return data;
  },

  insertSynthSet: function() {
    this.model.insertSynthSet();
    this.listenToOnce(this.model, 'synthsetInserted', function() {
      app.trigger('requestform:setView', this.model);
    }.bind(this));
  },

  destroySynthSet: function() {
    this.model.cleanSynthSet();
  },

});