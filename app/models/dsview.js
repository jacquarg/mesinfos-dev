module.exports = Backbone.Model.extend({

  getDocType: function() {
    return this.get('docType');
  },

  getName: function() {
    return this.get('name');
  },

  getMapFunction: function() {
    return this.get('mapFunction');
  },

  updateDSView: function() {
    console.debug('updateDSView');
    var self = this;
    cozysdk.defineView(this.getDocType(),
      this.getName(),
      this.getMapFunction(), function(err) {
        cozysdk.run(self.getDocType(), self.getName(),
              { limit: 1 }, console.log);
      });
  },

});
