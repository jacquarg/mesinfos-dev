module.exports = Mn.ItemView.extend({
    tagName: 'li',

    template: require('views/templates/dsviewhistoryitem'),

    events: {
      'click *': 'setDSView',
    },

    behaviors: {
      'Destroy': {},
    },

    setDSView: function() {
      require('application').trigger('requestform:setView', this.model);
    },
});
