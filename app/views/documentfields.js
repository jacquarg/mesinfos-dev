module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  className: 'doctype',
  template: require('views/templates/document'),

  childView: require('views/field'),

  childViewContainer: '.fields',

  initialize: function() {
    console.log('here');
    // console.log(this.model)
    this.collection = new Backbone.Collection(this.model.get('fields'));
    console.log(this);
  },


});
