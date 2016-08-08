var app = undefined;
var DSView = require('models/dsview');


module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    name: '#inputname',
    mapFunction: '#inputmap',
    docType: '#inputdoctype',
  },

  events: {
    'change @ui.name': 'setParams',
    'change @ui.mapFunction': 'setParams',
    'change @ui.docType': 'setParams',
    'click #inputsend': 'send',
  },

  initialize: function() {
    app = require('application');

    this.listenTo(app, 'requestform:setView', this.setDSView)
  },

  setDSView: function(dsView) {
    this.model = dsView;
    // TODO : behavior .. ?
    this.ui.name.val(this.model.getName());
    this.ui.docType.val(this.model.getDocType());
    this.ui.mapFunction.val(this.model.getMapFunction());
  },

  setParams: function() {
    this.model = new DSView({
      name: this.ui.name.val(),
      mapFunction: this.ui.mapFunction.val(),
      docTypeOfView: this.ui.docType.val(),
      createdAt: new Date().toISOString(),
    });

    this.model.updateDSView();
  },

  send: function() {
    var model = this.model;
    new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset')) {
        return resolve();
      }

      app.dsViews.create(model, {success: resolve, erro: reject });
    })
    .then(model.updateDSView.bind(model))
    .then(function() {
      app.trigger('documents:fetch', model);
    });
  },


});
