var app = undefined;


module.exports = Mn.ItemView.extend({
  tagName: 'div',
  template: require('views/templates/documentation'),

  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.setModel);
  },

  setModel: function(model) {
    this.model = model;
    this.render();
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    if (this.model) {
      data.docType = app.docTypes.findWhere({ 'Nom': this.model.getDocType()}).toJSON();
      data.subsets = app.subsets.where({'DocType': this.model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
    }
    return data;
  },

});