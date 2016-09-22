module.exports = Mn.ItemView.extend({
    tagName: 'li',

    template: require('views/templates/subsetitem'),

    events: {
      'click h4': 'setDSView',
    },

    setDSView: function() {
      require('application').trigger('requestform:setView', this.model);
    },

});
