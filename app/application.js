// Main application that create a Mn.Application singleton and
// exposes it.

var utils = require('lib/utils');
var ap = require('lib/asyncpromise');

var Router = require('router');
var AppLayout = require('views/app_layout');

var DocumentsCollection = require('collections/documents');
var SubsetsCollection = require('collections/subsets');
var DSViewsCollection = require('collections/dsviews');

var Properties = require('models/properties');
require('views/behaviors');

var Application = Mn.Application.extend({

  initialize: function() {
    this.properties = Properties;
  },

  prepare: function() {
    return Promise.resolve($.getJSON('data/list_data.json'))
      .then(this._parseMetadata.bind(this))
  },

  prepareInBackground: function() {
    this.properties.fetch();

    return this._defineViews();
  },

  _parseMetadata: function(data) {
    var metadata = data["export"];
    this.subsets = new SubsetsCollection(metadata.filter(function(field) {
      return field.Nature === 'Subset';
    }));
    this.docTypes = new Backbone.Collection(metadata.filter(function(field) {
      return field.Nature === 'DocType';

    }));
    this.fields = metadata.filter(function(field) {
      return field.Nature !== 'Subset' && field.Nature !== 'DocType';
    });
  },

  _defineViews: function() {
    // Parallel
    // return Promise.all(this.subsets.map(function(subset) {
    //   return subset.updateDSView();
    // }));

    // Serie
    // return this.subsets.reduce(function(agg, subset) {
    //   return agg.then(subset.updateDSView());
    // }, Promise.resolve());
    var displayId = 'defineSubsetView';
    var self = this;
    var count = this.subsets.length;
    
    return ap.series(this.subsets, function(subset, index) {
      self.trigger('message:display', displayId, index + '/' + count + 
        ' Création de la requète ' + subset.getName());
      return subset.updateDSView();
    })
    .then(function() {
      self.trigger('message:hide', displayId);
    })
    .catch(utils.generateDisplayError(
      "Erreur lors de l'initialisation des requêtes."));

    // Deactivate
    // return Promise.resolve();
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
    var randomIndex = Math.floor(Math.random() * this.subsets.size());
    this.trigger('requestform:setView', this.subsets.at(randomIndex));
  },

});

var application = new Application();

module.exports = application;

document.addEventListener('DOMContentLoaded', function() {
  application.prepare()
    .then(function() { application.prepareInBackground();})
    .then(application.start.bind(application));
});

