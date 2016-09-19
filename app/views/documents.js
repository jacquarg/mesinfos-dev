var app = null;

module.exports = Mn.CompositeView.extend({
  tagName: 'div',
  template: require('views/templates/documents'),

  childView: require('views/documentfields'),
  childViewContainer: 'ul.documentslist',

  ui: {
    downloadButton: '#downloaddata',
  },

  initialize: function() {
    app = require('application');
  	this.listenTo(this.collection, 'reset', this.updateDownloadButton);
    this.listenTo(this.collection, 'reset', this.render);
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    if (this.collection && this.collection.dsView) {
      var model = this.collection.dsView;
      data.docType = app.docTypes.findWhere({ 'Nom': model.getDocType()}).toJSON();
      data.subsets = app.subsets.where({'DocType': model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
    }
    return data;
  },

  updateDownloadButton: function() {
    // Add data to the download button
    var app = require('application');

    var data = app.documents.toRawJSON();
    this.ui.downloadButton.attr('href', 'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(data, null, 2)));
    this.ui.downloadButton.attr('download', 
        app.documents.dsView.getDocType() + '-' +
        app.documents.dsView.getName() + '.json');
  },

});
