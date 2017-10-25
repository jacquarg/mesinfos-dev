module.exports = Mn.ItemView.extend({
    tagName: 'li',
    className: 'subset',

    template: require('views/templates/subsetitem'),

    events: {
      'click': 'setDSView',
    },

    initialize: function() {
      console.log(this.model)
    },
    setDSView: function() {
      require('application').trigger('requestform:setView', this.model);
    },

});
