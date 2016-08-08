module.exports = Backbone.Collection.extend({
  model: require('models/subset'),

  applySynthSetsStatus: function(synthSetProperty) {
    this.forEach(function(subset) {
      if (subset.getSynthSetName() in synthSetProperty) {
        subset.set('synthSetIds', synthSetProperty[subset.getSynthSetName()]);
      }
    });
  },
});
