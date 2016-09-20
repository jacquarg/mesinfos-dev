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
