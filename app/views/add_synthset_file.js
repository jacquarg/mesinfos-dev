'use-strict'

let app = undefined
const template = require('views/templates/add_synthset_file')

module.exports = Mn.ItemView.extend({
  tagName: 'div',
  template: template,
  ui: {
    fileInput: "input"
  },
  events: {
    "change @ui.fileInput": "onFileChange",
  },

  initialize: function() {
    app = require('application')
  },

  onFileChange: function (e) {
    const reader = new FileReader()
    reader.addEventListener('load', () => this.insertSynthSet(JSON.parse(reader.result)))
    reader.readAsText(this.ui.fileInput[0].files[0])
  },

  insertSynthSet: function(raw) {
    // TODO : use subset to handle destroy ? / remove
    const displayId = 'insertsynthset'
    const count = raw.length
    return funpromise.series(raw, (doc, index) => {
      app.trigger('message:display', displayId, 'Ajout de documents '
       + "TODO" + ' de synthèse ' + index + '/' + count)
      return this._insertOneSynthDoc(doc)
    })
    .then(() => {
      app.trigger('message:hide', displayId)
      this.trigger('synthsetInserted')
    })
    .catch((err) => {
      console.error(err)
      app.trigger('message:error', 'Error while processing data. Retry or check console.')
    });
  },

  _insertOneSynthDoc: function(row) {
    const docType = row.docType
    // Clean the document
    delete row._id
    delete row.id
    delete row._rev
    delete row.docType

    // and then, insert it !
    return cozy.client.data.create(docType, row)
  },
});
