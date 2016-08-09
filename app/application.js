// Main application that create a Mn.Application singleton and
// exposes it.

var Router = require('router');
var AppLayout = require('views/app_layout');

var DocumentsCollection = require('collections/documents');
var SubsetsCollection = require('collections/subsets');
var DSViewsCollection = require('collections/dsviews');

var Properties = require('models/properties');
require('views/behaviors');

var Application = Mn.Application.extend({

  prepare: function() {
    var self = this;
    return Promise.resolve($.getJSON('data/list_data.json'))
      .then(this._parseMetadata.bind(this))
      .then(this._initProperties.bind(this))
      // .then(this._defineViews.bind(this));
      ;
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

  _initProperties: function() {
    return Properties.then(function(properties) {
      this.properties = properties;

      this.subsets.applySynthSetsStatus(this.properties.get('synthSets'));
    }.bind(this));
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

