module.exports = Mn.ItemView.extend({
  tagName: 'div',
  className: function() {
    return 'field compact ' + this.model.get('Nature');
  },
  template: require('views/templates/field'),

  events: {
    // TODO : create a behaviour
    'click .toggle': 'toggleExpand',
  },

  toggleExpand: function() {
    console.debug('toggleExpand');
    this.$el.toggleClass('compact');
    this.$el.toggleClass('expanded');
  },
});
