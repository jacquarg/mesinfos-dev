module.exports = Mn.ItemView.extend({
  tagName: 'div',
  className: function() {
    return 'field compact ' + this.model.get('Nature');
  },
  template: require('views/templates/field'),

  behaviors: {
    Toggle: {},
  }

});
