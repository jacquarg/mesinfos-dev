'use-strict'

const Model = require('models/subset')

module.exports = Backbone.Collection.extend({
  model: Model,

  initialize: function() {
    app = require('application')
    this.listenTo(app.properties, 'change', this.updateSynthSetsStatus)
  },

  updateSynthSetsStatus: function() {
    synthSetProperty = app.properties.get('synthSets')

    this.forEach(function(subset) {
      if (subset.getSynthSetName() in synthSetProperty) {
        subset.set('synthSetIds', synthSetProperty[subset.getSynthSetName()])
      }
    });
  },

  addByWikidataIds: function (ids) {
    ids.forEach((id) => {
      this.add(PLD.getItem(id))
    })
  },


});
