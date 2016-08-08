module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  className: 'doctype',
  template: require('views/templates/document'),

  childView: require('views/field'),

  childViewContainer: '.fields',

  initialize: function() {
    this.collection = new Backbone.Collection(this.model.get('fields'));
  },


});
