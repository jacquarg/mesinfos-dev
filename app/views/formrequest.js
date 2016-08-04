var app = undefined;

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    name: '#inputname',
    mapFunction: '#inputmap',
    docType: '#inputdoctype',
  },

  events: {
    'change @ui.name': 'updateModel',
    'change @ui.mapFunction': 'updateModel',
    'change @ui.docType': 'updateModel',
    'click #inputsend': 'send',
  },

  initialize: function() {
    app = require('application');
    console.log('initialize');
    console.log(app);

    // TODO : accept 'View Model' .
    this.listenTo(app, 'requestform:setView', this.setDSView)
  },

  setDSView: function(dsView) {
    this.model = dsView;
    // TODO : behavior .. ?
    this.ui.name.val(this.model.getName());
    this.ui.docType.val(this.model.getDocType());
    this.ui.mapFunction.val(this.model.getMapFunction());
  },

  updateModel: function() {
    console.debug('updateModel');
    this.model.set({
      name: this.ui.name.val(),
      mapFunction: this.ui.mapFunction.val(),
      docType: this.ui.docType.val(),
    });

    this.model.updateDSView();
  },

  send: function() {
    console.debug('send');
    console.log(this.model);
    //TODO this.updateModel();
    this.model.updateDSView();
    app.trigger('documents:fetch', this.model);
  },


});
