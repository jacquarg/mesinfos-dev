var DSViewsList = require('views/dsviewslist');
var RequestForm = require('views/formrequest');
var Documents = require('views/documents');

var DSView = require('models/dsview');

var app = undefined;

module.exports = Mn.LayoutView.extend({

  template: require('views/templates/app_layout'),
  el: '[role="application"]',

  behaviors: {},

  // ui: {
  //   dsViewsList: 'aside .dsviewslist',
  //   dataContent: '.datacontent',
  //   requestForm: '.requestform',
  // },

  regions: {
    dsViewsList: 'aside.dsviewslist',
    documents: '.documents',
    requestForm: '.requestform',

  },

  initialize: function() {
    app = require('application');
  },

  onRender: function() {
    this.dsViewsList.show(new DSViewsList({ collection: app.subsets }));
    this.requestForm.show(new RequestForm({ model: new DSView() }));
    this.documents.show(new Documents({ collection: app.documents }));
  },
});
