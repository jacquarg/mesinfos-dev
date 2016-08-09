var app = null;

module.exports = Backbone.Collection.extend({
  model: require('models/subset'),

  initialize: function() {
    app = require('application');
    this.listenTo(app.properties, 'change', this.updateSynthSetsStatus);
  },

  updateSynthSetsStatus: function() {
    synthSetProperty = app.properties.get('synthSets');

    this.forEach(function(subset) {
      if (subset.getSynthSetName() in synthSetProperty) {
        subset.set('synthSetIds', synthSetProperty[subset.getSynthSetName()]);
      }
    });
  },

});
