var groupByProjection = require('lib/groupbyprojection');


module.exports = Mn.ItemView.extend({
  template: function() { return "";}, // TODO :remove this hack.
  childView: undefined,
  childViewContainer: undefined,
  groupBy: undefined,
  comparator: undefined,

  initialize: function() {
    this.listenTo(this.collection, "sync remove add change", this.render);
  },

  onRender: function() {
    this.groups = groupByProjection(this.collection, {
        groupBy: this.groupBy,
        comparator: this.comparator,
    });
    Object.keys(this.groups).forEach(this._appendGroup, this);
  },

  _appendGroup: function(groupName) {
    var view = new this.childView({
      collection: this.groups[groupName],
      model: new Backbone.Model({groupTitle: groupName}),
    });
    view.render();
    var containerEl = this.childViewContainer ? this.$el.find(this.childViewContainer) : this.$el;

    containerEl.append(view.$el);
  },


});
