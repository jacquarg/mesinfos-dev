var GroupsView = require('lib/groupsview');

module.exports = GroupsView.extend({
  template: require('views/templates/typologies'),
  tagName: 'div',
  className: 'container-fluid',
  childViewContainer: 'ul.typologies',

  groupBy: 'Typologie',
  comparator: 'Nom',

  childView: Mn.CompositeView.extend({
    tagName: 'li',
    className: 'dropdown',
    template: require('views/templates/typology'),
    childViewContainer: 'ul',
    childView: require('views/subsetitem'),
  }),

});
