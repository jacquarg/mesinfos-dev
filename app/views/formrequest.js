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
    console.debug('updateModel');
    this.model = new DSView({
      name: this.ui.name.val(),
      mapFunction: this.ui.mapFunction.val(),
      docTypeOfView: this.ui.docType.val(),
      createdAt: new Date().toISOString(),
    });

    this.model.updateDSView();
  },

  send: function() {
    new Promise(function(resolve, reject) {
      console.log(this);
      console.log(this.model);
      this.model.save({success: resolve, erro: reject });
    }.bind(this)).then(this.model.updateDSView.bind(this))
      .then(function() {
        app.trigger('documents:fetch', this.model);
      });
    // console.debug('send');
    // console.log(this.model);
    // //TODO this.updateModel();
    // this.model.updateDSView();
    // app.trigger('documents:fetch', this.model);
  },


});
