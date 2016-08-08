var GroupsView = require('lib/groupsview');

module.exports = GroupsView.extend({
  tagName: 'ul',
  groupBy: 'Typologie',
  comparator: 'Nom',

  childView: Mn.CompositeView.extend({
    tagName: 'li',
    template: require('views/templates/typology'),
    childViewContainer: 'ul',
    childView: require('views/subsetitem'),
  }),

});
