var MessageView = require('views/message');
var GroupsDSView = require('views/groupsdsviews');
var RequestForm = require('views/formrequest');
var Documentation = require('views/documentation');
var Documents = require('views/documents');
var Typologies = require('views/typologies');
var AddSynthSetFile = require('views/add_synthset_file');
var DSView = require('models/dsview');


var app = undefined;

module.exports = Mn.LayoutView.extend({

  template: require('views/templates/app_layout'),
  el: '[role="application"]',

  behaviors: {},

  regions: {
    dsViewsList: '.dsviewshistory',
    typologies: 'nav.typologies',
    documentation: '.documentation',
    documents: '.documents',
    requestForm: '.requestform',
    message: '.message',
    fileinput: '.fileinput',
  },

  initialize: function() {
    app = require('application');
  },


  onRender: function() {
    this.message.show(new MessageView());
    this.dsViewsList.show(new GroupsDSView({ collection: app.dsViews}));
    this.typologies.show(new Typologies({ collection: app.subsets }));
    this.requestForm.show(new RequestForm());
    this.documentation.show(new Documentation());
    this.documents.show(new Documents({ collection: app.documents }));
    this.fileinput.show(new AddSynthSetFile());
  },
});
