var app = undefined;
var template = require('views/templates/add_synthset_file');
var ap = require('lib/asyncpromise');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: template,
  ui: {
    fileInput: "input",
  },
  events: {
    "change @ui.fileInput": "onFileChange",
  },

  initialize: function() {
    app = require('application');
  },

  onFileChange: function (e) {
    var reader = new FileReader();
    var self = this;
    reader.addEventListener('load', function() {
      console.log(JSON.parse(reader.result));
      self.insertSynthSet(JSON.parse(reader.result));
      //      alert('Contenu du fichier "' + fileInput.files[0].name + '" :\n\n' + reader.result);
    });
    console.log(this.ui.fileInput)

    reader.readAsText(this.ui.fileInput[0].files[0]);
  },

  insertSynthSet: function(raw) {
    // TODO : use subset to handle destroy ? / remove

    var displayId = 'insertsynthset';
    var self = this;
    var count = raw.length;
    return ap.series(raw, function(doc, index) {
      app.trigger('message:display', displayId, 'Ajout de documents '
       + "TODO" + ' de synthèse ' + index + '/' + count);
      return self._insertOneSynthDoc(doc);
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
    var docType = row.docType;
    // Clean the document
    delete row._id;
    delete row.id;
    delete row._rev;
    delete row.docType;

    // and then, insert it !
    return cozy.client.data.create(docType, row);
  },
});
