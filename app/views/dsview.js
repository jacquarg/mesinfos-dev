
module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  template: require('views/templates/dsview'),
  childView: require('views/dsviewhistoryitem'),
  childViewContainer: 'ul.history',

  ui:  {
    'name': 'h4',
    'toHide': 'ul.history',
  },

  events: {
    'click @ui.name': 'setDSView',
  },

  behaviors: {
    Toggle: {},
    Destroy: { onDestroy: 'onDestroyAll', },
  },

  setDSView: function() {
      require('application').trigger('requestform:setView',
        this.collection.first());
  },

  serializeModel: function() {
    return Mn.CompositeView.prototype.serializeModel(this.collection.first());
  },

  onDestroyAll: function() {
    this.collection.toArray().forEach(function(model) { model.destroy(); });
  },
});
