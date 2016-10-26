var app = undefined;
var DSView = require('models/dsview');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    name: '#inputname',
    mapFunction: '#inputmap',
    docType: '#inputdoctype',
    queryName: '#queryname',
    queryDocType: '#querydoctype',
    queryParams: '#queryparams',
  },

  events: {
    'change @ui.name': 'setParams',
    'change @ui.mapFunction': 'setParams',
    'change @ui.docType': 'setParams',
    'change @ui.queryParams': 'setParams',
    'click #inputsend': 'send',
  },

  modelEvents: {
    'change': 'updateView',
  },

  initialize: function() {
    app = require('application');

    this.listenTo(app, 'requestform:setView', this.setDSView);
  },

  setDSView: function(dsView) {
    this.model = dsView;
    // TODO : behavior .. ?
    this.updateView();
    this.send();

  },

  updateView: function() {
    this.ui.name.val(this.model.getName());
    this.ui.queryName.val(this.model.getName());
    this.ui.docType.val(this.model.getDocType());
    this.ui.queryDocType.val(this.model.getDocType());
    this.ui.mapFunction.val(this.model.getMapFunction());

    this.ui.queryParams.val(JSON.stringify(this.model.getQueryParams()));
  },

  setParams: function() {
    this.model = new DSView({
      name: this.ui.name.val(),
      mapFunction: this.ui.mapFunction.val(),
      docTypeOfView: this.ui.docType.val(),
      queryParams: JSON.parse(this.ui.queryParams.val()),
      createdAt: new Date().toISOString(),
    });

    this.model.updateDSView();
    this.updateView();
  },

  send: function() {
    if (!this.model) { return console.info('No DSView to request !');}

    var displayId = 'datarequest';
    var self = this;
    var model = this.model;
    return new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset') || !model.isNew()) {
        return resolve();
      }

      app.dsViews.create(model, {success: resolve, error: reject });
    })
    // .then(function() {
    //   // app.trigger('message:display', displayId,
    //     // 'Creation de la vue ' + model.getName());
    // })
    .then(model.updateDSView.bind(model))
    .then(function() {
      // app.trigger('message:hide', displayId);
      app.trigger('documents:fetch', model);
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error. Try again or check the console.');
    });
  },

});
