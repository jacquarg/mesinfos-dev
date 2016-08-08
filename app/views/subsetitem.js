module.exports = Mn.ItemView.extend({
    tagName: 'li',

    template: require('views/templates/subsetitem'),

    events: {
      'click li': 'setDSView',
      'click .insert': 'insertSynthSet',
    },

    behaviors: {
      Destroy: { onDestroy: 'destroySynthSet'},
    },

    serializeModel: function(model) {
      var json = $.extend({}, model.attributes);
      json.synthSetInsertable = model.synthSetAvailable();
      json.synthSetInDS = model.synthSetInDS();

      return json;
    },

    setDSView: function() {
      require('application').trigger('requestform:setView', this.model);
    },

    insertSynthSet: function() {
      this.model.insertSynthSet();
    },

    destroySynthSet: function() {
      this.model.cleanSynthSet();
    },

});
