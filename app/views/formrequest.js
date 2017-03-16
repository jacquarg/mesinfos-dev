var app = undefined;
var DSView = require('models/dsview');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    indexFields: '#inputfields',
    docType: '#inputdoctype',
    queryParams: '#queryparams',
  },

  events: {
    'change @ui.indexFields': 'setParams',
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
    this.ui.docType.val(this.model.getDocType());
    this.ui.indexFields.val(this.model.getIndexFields());
    this.ui.queryParams.val(JSON.stringify(this.model.getQueryParams()));
  },

  setParams: function() {
    console.debug('estparams')
    this.model = new DSView({
      docTypeOfView: this.ui.docType.val(),
      indexFields: this.ui.indexFields.val().split(',').map(function(field) { return field.trim(); }),
      queryParams: JSON.parse(this.ui.queryParams.val()),
      createdAt: new Date().toISOString(),
    });

    //this.model.updateDSView();
    this.updateView();
    console.log(this.model)
  },

  send: function() {
    if (!this.model) {
    // TODO !!        return console.info('No DSView to request !');
      this.model = new DSView();
    }

    var displayId = 'datarequest';
    var self = this;
    var model = this.model;
    return new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset') || !model.isNew()) {
        return resolve();
      }
      console.log('here')
      app.dsViews.create(model, {success: resolve, error: reject });
    })
    //
    //.then(function() {
    //  console.log('here2')

    //   // app.trigger('message:display', displayId,
    //     // 'Creation de la vue ' + model.getName());
    //})
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
