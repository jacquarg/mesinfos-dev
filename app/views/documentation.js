var app = undefined;
var semutils = require('lib/semantic_utils');

module.exports = Mn.ItemView.extend({
  tagName: 'div',
  template: require('views/templates/documentation'),

  events: {
    'click .insert': 'insertSynthSet',
  },

  behaviors: {
    Destroy: { onDestroy: 'destroySynthSet'},
  },

  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.setModel);
  },

  setModel: function(model) {
    this.model = model;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    // Test here if model is not null ; and model is a subset.
    if (this.model && this.model.synthSetAvailable) {
      data = this.model.toJSON();
      data.synthSetInsertable = this.model.synthSetAvailable();
      data.synthSetInDS = this.model.synthSetInDS();
      data.docType = app.doctypes[this.model.get('cozyDoctypeName')];
      data.subsets = app.subsets.where({'cozyDoctypeName': this.model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
      if (data.hasProperty) {
        data.hasProperty = data.hasProperty.map(item => semutils.getItem(item, app.wikiapi))
      }
      if (data.updateFrequency) {
        data.updateFrequency = moment.duration(data.updateFrequency).humanize()
      }
      if (data.updateLatency) {
        data.updateLatency = moment.duration(data.updateLatency).humanize()
      }
    }
    return data;
  },

  insertSynthSet: function() {
    this.model.insertSynthSet();
    this.listenToOnce(this.model, 'synthsetInserted', function() {
      app.trigger('requestform:setView', this.model);
    }.bind(this));
  },

  destroySynthSet: function() {
    this.model.cleanSynthSet();
  },

});
