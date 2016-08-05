// var DSView = require('models/dsview');

module.exports = Mn.ItemView.extend({
    tagName: 'li',

    template: require('views/templates/dsviewitem'),

    events: {
      'click li': 'setView',
    },

    setView: function() {
      console.log('toto');
      console.log(this.model);
      require('application').trigger('requestform:setView', this.model);
    },
       initialize: function(){ console.log('BookItemView: initialize >>> ' + this.model.get('title')) },
        onRender: function(){ console.log('BookItemView: onRender >>> ' + this.model.get('title')) },
        onShow: function(){ console.log('BookItemView: onShow >>> ' + this.model.get('title')) }
});
