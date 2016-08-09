var GroupsDSView = require('views/groupsdsviews');
var RequestForm = require('views/formrequest');
var Documents = require('views/documents');
var Typologies = require('views/typologies');

var DSView = require('models/dsview');


var app = undefined;

module.exports = Mn.LayoutView.extend({

  template: require('views/templates/app_layout'),
  el: '[role="application"]',

  behaviors: {},

  regions: {
    dsViewsList: '.dsviewshistory',
    typologies: 'aside .typologies',
    documents: '.documents',
    requestForm: '.requestform',
  },

  initialize: function() {
    app = require('application');
  },


  onRender: function() {
    this.dsViewsList.show(new GroupsDSView({ collection: app.dsViews}));
    this.typologies.show(new Typologies({ collection: app.subsets }));
    this.requestForm.show(new RequestForm({ model: new DSView() }));
    this.documents.show(new Documents({ collection: app.documents }));
  },
});
