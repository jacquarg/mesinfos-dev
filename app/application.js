// Main application that create a Mn.Application singleton and
// exposes it.

var Router = require('router');
var AppLayout = require('views/app_layout');

var DocumentsCollection = require('collections/documents');
var SubsetsCollection = require('collections/subsets');

var Application = Mn.Application.extend({

  prepare: function() {
    var self = this;
    return Promise.resolve($.getJSON('data/list_data.json'))
    .then(function(data) {
      var metadata = data["export"];
      self.subsets = new SubsetsCollection(metadata.filter(function(field) {
        return field.Nature === 'Subset';
      }));
      self.docTypes = new Backbone.Collection(metadata.filter(function(field) {
        return field.Nature === 'Doctype';

      }));
      self.fields = metadata.filter(function(field) {
        return field.Nature !== 'Subset' && field.Nature !== 'Doctype';
      });
    });
  },

  onBeforeStart: function() {
    this.layout = new AppLayout();
    this.router = new Router();

    this.documents = new DocumentsCollection();

    if (typeof Object.freeze === 'function') {
      Object.freeze(this);
    }
  },

  onStart: function() {
    this.layout.render();
    console.debug('here');
    // prohibit pushState because URIs mapped from cozy-home
    // rely on fragment
    if (Backbone.history) {
      Backbone.history.start({ pushState: false });
    }
  },

});

var application = new Application();

module.exports = application;

document.addEventListener('DOMContentLoaded', function() {
  application.prepare()
    .then(application.start.bind(application));
});
