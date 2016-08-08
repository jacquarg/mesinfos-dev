// Main application that create a Mn.Application singleton and
// exposes it.

var Router = require('router');
var AppLayout = require('views/app_layout');

var DocumentsCollection = require('collections/documents');
var SubsetsCollection = require('collections/subsets');
var DSViewsCollection = require('collections/dsviews');

require('views/behaviors');

var Application = Mn.Application.extend({

  prepare: function() {
    return Promise.resolve($.getJSON('data/list_data.json'))
      .then(this._parseMetadata.bind(this))
      // .then(this._defineViews.bind(this));
  },

  _parseMetadata: function(data) {
      var metadata = data["export"];
      this.subsets = new SubsetsCollection(metadata.filter(function(field) {
        return field.Nature === 'Subset';
      }));
      this.docTypes = new Backbone.Collection(metadata.filter(function(field) {
        return field.Nature === 'Doctype';

      }));
      this.fields = metadata.filter(function(field) {
        return field.Nature !== 'Subset' && field.Nature !== 'Doctype';
      });
  },

  _defineViews: function() {
    return Promise.all(this.subsets.map(function(subset) {
      return subset.updateDSView();
    }));
  },

  onBeforeStart: function() {
    this.layout = new AppLayout();
    this.router = new Router();

    this.documents = new DocumentsCollection();
    this.dsViews = new DSViewsCollection();
    this.dsViews.fetch();



    if (typeof Object.freeze === 'function') {
      Object.freeze(this);
    }
  },

  onStart: function() {
    this.layout.render();
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

