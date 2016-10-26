(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("application.js", function(exports, require, module) {
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


});

require.register("collections/documents.js", function(exports, require, module) {
var app = undefined;

module.exports = Backbone.Collection.extend({


  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.fetchDSView);
  },

  fetchDSView: function(dsView) {
    this.setDSView(dsView);
    this.reset(); // reset first to empty the view.
    this.fetch({ reset: true });
  },

  setDSView: function(dsView) {
    this.dsView = dsView;
  },

  toRawJSON: function() {
    return this.map(function(doc) {
      var res = doc.toJSON();
      delete res.fields;
      delete res._result;
      return res;
    });
  },

  // Generate fields, with the metadata !
  parse: function(resp, options) {
    return resp.map(this._generateFields);
  },

  _generateFields: function(res) {
    var doc = res.doc;

    var fieldsDocumentation = app.fields.filter(function(field) {
      // TODO : origin too ?
      return field.DocType.toLowerCase() === doc.docType.toLowerCase();
    });

    var viewedFields = {};
    var fields = fieldsDocumentation.reduce(function(agg, field) {
      if (!doc[field.Nom]) { return agg; }

      viewedFields[field.Nom] = true;
      var f = $.extend({}, field);
      f.value = doc[field.Nom];
      agg.push(f);
      return agg;
    }, []);

    for (var k in doc) {
      if (!(k in viewedFields)) {
        fields.push({ Nom: k, value: doc[k] })
      }
    }

    fields.sort(function(a, b) {
      if (a.Nature === 'Metadata' && b.Nature !== 'Metadata') {
          return 1;
      } else if (a.Nature !== 'Metadata' && b.Nature === 'Metadata') {
          return -1;
      } else {
          return a.Nom > b.Nom ? 1 : -1;
      }
    });
    doc.fields = fields;

    delete res.doc; // avoid circular links
    doc._result = res;
    return doc;
  },

  // override sync

  sync: function(method, collection, options) {
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }

      return;
    }

    cozysdk.run(this.dsView.getDocType(), this.dsView.getName(), this.dsView.getQueryParams(),
      function(err, results) {
        if (err) {
          if (options.error) { options.error(err); }
          return;
        }

        options.success(results);
      });
  },

});

});

require.register("collections/dsviews.js", function(exports, require, module) {
var DSView = require('models/dsview');

module.exports = Backbone.Collection.extend({
  model: DSView,

  sync: function(method, collection, options) {
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }

      return;
    }

    var docType = new this.model().docType.toLowerCase();
    
    cozysdk.defineView(docType, 'all', 'function(doc) { emit(doc._id); }').then(
    cozysdk.run(docType, 'all', { include_docs: true }, function(err, results) {
      if (err) { return options.error(err); }

      return options.success(results.map(function(res) { return res.doc; }));
    }));
  },

});

});

require.register("collections/subsets.js", function(exports, require, module) {
var app = null;

module.exports = Backbone.Collection.extend({
  model: require('models/subset'),

  initialize: function() {
    app = require('application');
    this.listenTo(app.properties, 'change', this.updateSynthSetsStatus);
  },

  updateSynthSetsStatus: function() {
    synthSetProperty = app.properties.get('synthSets');

    this.forEach(function(subset) {
      if (subset.getSynthSetName() in synthSetProperty) {
        subset.set('synthSetIds', synthSetProperty[subset.getSynthSetName()]);
      }
    });
  },

});

});

require.register("lib/asyncpromise.js", function(exports, require, module) {
module.exports = {
  
  series: function(iterable, callback, self) {
    var results = [];
    
    return iterable.reduce(function(sequence, id, index, array) {
      return sequence.then(function(res) {
        results.push(res);
        return callback.call(self, id, index, array);
      });
    }, Promise.resolve(true)).then(function(res) {
      return new Promise(function(resolve, reject) {
        results.push(res);
        resolve(results.slice(1));
      });
    });
  },
}
});

;require.register("lib/groupbyprojection.js", function(exports, require, module) {
var Filtered = BackboneProjections.Filtered;
var Sorted = BackboneProjections.Sorted;

module.exports = function(collection, options) {
  var groups = collection.groupBy(options.groupBy);
  var projections = {};
  for (var key in groups) {
    projections[key] = new Filtered(collection, {
      filter: function(item) {
        return groups[key].indexOf(item) !== -1;
      }
    });

    if (options.comparator) {
      projections[key] = new Sorted(projections[key], { comparator: options.comparator });
    }
  }

  return projections;
};

});

require.register("lib/groupsview.js", function(exports, require, module) {
var groupByProjection = require('lib/groupbyprojection');


module.exports = Mn.ItemView.extend({
  template: function() { return "";}, // TODO :remove this hack.
  childView: undefined,
  childViewContainer: undefined,
  groupBy: undefined,
  comparator: undefined,

  initialize: function() {
    this.listenTo(this.collection, "sync remove add change", this.render);
  },

  onRender: function() {
    this.groups = groupByProjection(this.collection, {
        groupBy: this.groupBy,
        comparator: this.comparator,
    });
    Object.keys(this.groups).forEach(this._appendGroup, this);
  },

  _appendGroup: function(groupName) {
    var view = new this.childView({
      collection: this.groups[groupName],
      model: new Backbone.Model({groupTitle: groupName}),
    });
    view.render();
    var containerEl = this.childViewContainer ? this.$el.find(this.childViewContainer) : this.$el;

    containerEl.append(view.$el);
  },


});

});

require.register("lib/utils.js", function(exports, require, module) {
module.exports = {
  slugify: function(stringNonNull) {
    return stringNonNull.toLowerCase().replace(/[^\w-]+/g,'');
  },

  test2MapFunction: function(test) {
    return "function(doc) {\n  " + test + "\n}";
  },


  appNameNVersion: function() {
    // TODO !
    // var pkg = require('package.json');
    //return pkg.name + '-' + pkg.version;
    return 'mesinfosdataplayground' + '-' + '0.0.4-dev';
  },

  generateDisplayError: function(message)  {
    return function(err) {
      console.error(err);
      require('application').trigger('message:error', message);
    };
  },

};

});

require.register("models/dsview.js", function(exports, require, module) {
var utils = require('lib/utils');

module.exports = Backbone.Model.extend({
  docType: 'DSView',

  defaults: {
    docTypeVersion: utils.appNameNVersion(),
  },

  getDocType: function() {
    return this.get('docTypeOfView');
  },

  getName: function() {
    return this.get('name');
  },

  getMapFunction: function() {
    return this.get('mapFunction');
  },

  getQueryParams: function() {
    return this.get('queryParams');
  },

  updateDSView: function() {
    var app = require('application');
    var displayId = 'updateDSView';
    var self = this;
    var start = Date.now();
    app.trigger('message:display', displayId, 'defineView ' + self.getName());
    
    return cozysdk.defineView(this.getDocType(), this.getName(),
      this.getMapFunction())
    .then(function(err) {
      app.trigger('message:display', displayId, 'initialize ' + self.getName());
        cozysdk.run(self.getDocType(), self.getName(), { limit: 1 });
      })
    .then(function() {
      app.trigger('message:display', displayId, self.getName() + ' màj en '
       + (Date.now() - start) / 1000 + 's.');
    })
    .catch(utils.generateDisplayError(
      'Erreur pendant updateView ' + self.getName()));
  },

  parse: function(raw) {
    raw.id = raw._id;
    return raw;
  },

  sync: function(method, model, options) {
    var callback = function(err, res) {
      if (err) { return options.error(err); }
      options.success(res);
    }

    if (method === 'create') {
      return cozysdk.create('DSView', model.attributes, callback);
    } else if (method === 'update' || method === 'patch') {
      return cozysdk.updateAttributes('DSView', model.attributes._id, model.attributes, callback);
    } else if (method === 'delete') {
      return cozysdk.destroy('DSView', model.attributes._id, callback);
    } else if (method === 'read') {
      return cozysdk.find('DSView', model.attributes._id, callback);
    }
  }
});

});

require.register("models/properties.js", function(exports, require, module) {
var appName = require('lib/utils').appNameNVersion;

var Properties = Backbone.Model.extend({

  docType: 'MesInfosDataPlaygroundProperties'.toLowerCase(),
  defaults: {
    docTypeVersion: appName(),
    synthSets: {},
  },


  parse: function(raw) {
    raw.id = raw._id;
    return raw;
  },

  sync: function(method, model, options) {
    var callback = function(err, res) {
      if (err) { return options.error(err); }
      options.success(res);
    }

    if (method === 'create') {
      return cozysdk.create(this.docType, model.attributes, callback);
    } else if (method === 'update' || method === 'patch') {
      return cozysdk.updateAttributes(this.docType, model.attributes._id, model.attributes, callback);
    } else if (method === 'delete') {
      return cozysdk.destroy(this.docType, model.attributes._id, callback);
    } else if (method === 'read') {
      if (model.isNew()) {
        return cozysdk.defineView(Properties.prototype.docType, 'all',
        'function(doc) { emit(doc._id);}'
          ).then(function() {
              return cozysdk.queryView(Properties.prototype.docType, 'all', {limit: 1, include_docs: true}); }
          ).then(function(res) {
            // TODO error handling !
            return (res && res.length !== 0) ? res[0].doc : {};
          }).then(options.success, options.error);
      } else {
        return cozysdk.find(this.docType, model.attributes._id)
          .then(options.success, options.error);
      }
    }
  },

  _promiseSave: function(attributes) {
    return new Promise(function(resolve, reject) {
      this.save(attributes, { success: resolve, error: reject });
    }.bind(this));
  },

  addSynthSetIds: function(setName, ids) {
    var set = this.get('synthSets')[setName];
    set = set ? set.concat(ids) : ids;

    var sets = this.get('synthSets');
    sets[setName] = set;
    return this._promiseSave({ synthSets: sets });
    // return new Promise(function(resolve, reject) {
    //   this.save({ synthSets: sets }, { success: resolve, error: reject });
    // }.bind(this));
  },

  cleanSynthSetIds: function(setName) {
    var sets = this.get('synthSets');
    delete sets[setName];
    return this._promiseSave({ synthSets: sets});
  },

});

module.exports = new Properties();

});

require.register("models/subset.js", function(exports, require, module) {
var DSView = require('models/dsview');
var utils = require('lib/utils');
var ap = require('lib/asyncpromise');
var app = null;

module.exports = DSView.extend({
  initialize: function() {
    app = require('application');
  },

  getDocType: function() {
    return this.get('DocType');
  },

  getName: function() {
    return utils.slugify(this.get('Nom'));
  },

  getMapFunction: function() {
    return utils.test2MapFunction(this.get('Format'));
  },


  getQueryParams: function() {
    return {
      limit: 10,
      include_docs: true
    };

  },

  // Readonly!
  save: function(options) {
    return options.success();
  },

  // Manage synth set
  synthSetAvailable: function() {
    var setName = this.getSynthSetName();
    return setName && setName !== '' ;
  },

  getSynthSetName: function(){
    return this.get('Exemple');
  },

  insertSynthSet: function() {
    var displayId = 'insertsynthset';
    var self = this;
    if (!this.synthSetAvailable()) { return Promise.resolve(false); }
    
    return Promise.resolve($.getJSON('data/'+ self.getSynthSetName() +'.json'))
    .then(function(raw) {
      var count = raw.length;
      return ap.series(raw, function(doc, index) {
        app.trigger('message:display', displayId, 'Ajout de documents '
         + self.getDocType() + ' de synthèse ' + index + '/' + count);
        return self._insertOneSynthDoc(doc);
      });
    })
    .then(function(ids) {
      ids = ids.map(function(obj) { return obj._id; });
      app.trigger('message:display', displayId, 'Mise à jour des paramètres');
      return app.properties.addSynthSetIds(self.getSynthSetName(), ids);
    })
    .then(function() { 
      app.trigger('message:hide', displayId);
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error while processing data. Retry or check console.');
    });

  },

  _insertOneSynthDoc: function(row) {
    delete row._id;
    delete row.id;
    return cozysdk.create(this.getDocType(), row);
  },

  cleanSynthSet: function() {
    var displayId = 'deletesynthset';
    var self = this;

    var count = self.get('synthSetIds').length;
    
    return ap.series(self.get('synthSetIds'), function(id, index) {
        app.trigger('message:display', displayId, 'Suppression des documents '
         + self.getDocType() + ' de synthèse ' + index + '/' + count);
        return cozysdk.destroy(self.getDocType(), id);
    })
    .then(function() {
      app.trigger('message:display', displayId, 'Màj des paramètres');
      self.unset('synthSetIds');
      return app.properties.cleanSynthSetIds(self.getSynthSetName());
    })
    .then(function() {
      app.trigger('message:hide', displayId);
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Erreur pendant la suppression de données de synthèse. Réessayer, ou consultez la console pour en savoir plus.')
    });

    // return Promise.all(self.get('synthSetIds').map(
    //   function(id) { return cozysdk.destroy(self.getDocType(), id); })
    // )

  },

  synthSetInDS: function() {
    return this.has('synthSetIds');
  },



});

});

require.register("router.js", function(exports, require, module) {
var app = undefined

module.exports = Backbone.Router.extend({
    routes: {
        '': 'index',
    },

    initialize: function() {
      app = require('application');
    },


    });

});

require.register("views/app_layout.js", function(exports, require, module) {
var MessageView = require('views/message');
var GroupsDSView = require('views/groupsdsviews');
var RequestForm = require('views/formrequest');
var Documentation = require('views/documentation');
var Documents = require('views/documents');
var Typologies = require('views/typologies');

var DSView = require('models/dsview');


var app = undefined;

module.exports = Mn.LayoutView.extend({

  template: require('views/templates/app_layout'),
  el: '[role="application"]',

  behaviors: {},

  regions: {
    dsViewsList: '.dsviewshistory',
    typologies: 'nav.typologies',
    documentation: '.documentation',
    documents: '.documents',
    requestForm: '.requestform',
    message: '.message',
  },

  initialize: function() {
    app = require('application');
  },


  onRender: function() {
    this.message.show(new MessageView());
    this.dsViewsList.show(new GroupsDSView({ collection: app.dsViews}));
    this.typologies.show(new Typologies({ collection: app.subsets }));
    this.requestForm.show(new RequestForm());
    this.documentation.show(new Documentation());
    this.documents.show(new Documents({ collection: app.documents }));
  },
});

});

require.register("views/behaviors/destroy.js", function(exports, require, module) {
module.exports = Mn.Behavior.extend({

  events: {
    'click .delete': 'destroyObject',
  },

  destroyObject: function() {
    if (this.options.onDestroy) {
      this.view[this.options.onDestroy]();
    } else {
      this.view.model.destroy();
    }
  },
});

});

require.register("views/behaviors/index.js", function(exports, require, module) {
Mn.Behaviors.behaviorsLookup = function() { return window.Behaviors; };

window.Behaviors = {
  Toggle: require('views/behaviors/toggle'),
  Destroy: require('views/behaviors/destroy'),
};

});

require.register("views/behaviors/toggle.js", function(exports, require, module) {
module.exports = Mn.Behavior.extend({

  events: {
    'click .toggle': 'toggleExpand',
  },


  toggleExpand: function() {
    this.$el.toggleClass('compact');
    this.$el.toggleClass('expanded');

    // if (this.ui.toHide) {
    //   if (this.expanded) {
    //     this.ui.toHide.hide();
    //   } else {
    //     this.ui.toHide.show();
    //   }
    // }

    // this.expanded = !this.expanded;
  },

  onRender: function() {
    this.$el.addClass('compact');
    // this.expanded = false;
  }
});

});

require.register("views/documentation.js", function(exports, require, module) {
var app = undefined;


module.exports = Mn.ItemView.extend({
  tagName: 'div',
  template: require('views/templates/documentation'),

  events: {
    'click .insert': 'insertSynthSet',
  },

  behaviors: {
    Destroy: { onDestroy: 'destroySynthSet'},
  },

  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.setModel);
  },

  setModel: function(model) {
    this.model = model;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    // Test here if model is not null ; and model is a subset.
    if (this.model && this.model.synthSetAvailable) {
      data = this.model.toJSON();
      data.synthSetInsertable = this.model.synthSetAvailable();
      data.synthSetInDS = this.model.synthSetInDS();
      data.docType = app.docTypes.findWhere({ 'Nom': this.model.getDocType()}).toJSON();
      data.subsets = app.subsets.where({'DocType': this.model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
    }
    return data;
  },

  insertSynthSet: function() {
    this.model.insertSynthSet();
  },

  destroySynthSet: function() {
    this.model.cleanSynthSet();
  },


});
});

require.register("views/documentfields.js", function(exports, require, module) {
module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  className: 'result',
  template: require('views/templates/document'),

  childView: require('views/field'),

  childViewContainer: '.fields',

  initialize: function() {
    this.collection = new Backbone.Collection(this.model.get('fields'));
  },

});

});

require.register("views/documents.js", function(exports, require, module) {
var app = null;

module.exports = Mn.CompositeView.extend({
  tagName: 'div',
  template: require('views/templates/documents'),

  childView: require('views/documentfields'),
  childViewContainer: 'ul.documentslist',

  ui: {
    downloadButton: '#downloaddata',
  },

  initialize: function() {
    app = require('application');
  	this.listenTo(this.collection, 'reset', this.updateDownloadButton);
  },

  updateDownloadButton: function() {
    // Add data to the download button
    var data = app.documents.toRawJSON();
    this.ui.downloadButton.attr('href', 'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(data, null, 2)));
    this.ui.downloadButton.attr('download',
        app.documents.dsView.getDocType() + '-' +
        app.documents.dsView.getName() + '.json');
  },
});

});

require.register("views/dsview.js", function(exports, require, module) {

module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  template: require('views/templates/dsview'),
  childView: require('views/dsviewhistoryitem'),
  childViewContainer: 'ul.history',

  ui:  {
    'name': 'h4',
    'toHide': 'ul.history',
  },

  events: {
    'click @ui.name': 'setDSView',
  },

  behaviors: {
    Toggle: {},
    Destroy: { onDestroy: 'onDestroyAll', },
  },

  setDSView: function() {
      require('application').trigger('requestform:setView',
        this.collection.first());
  },

  serializeModel: function() {
    return Mn.CompositeView.prototype.serializeModel(this.collection.first());
  },

  onDestroyAll: function() {
    this.collection.toArray().forEach(function(model) { model.destroy(); });
  },
});

});

require.register("views/dsviewhistoryitem.js", function(exports, require, module) {
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

});

require.register("views/field.js", function(exports, require, module) {
module.exports = Mn.ItemView.extend({
  tagName: 'div',
  className: function() {
    return 'field compact ' + this.model.get('Nature');
  },
  template: require('views/templates/field'),

  behaviors: {
    Toggle: {},
  }

});

});

require.register("views/formrequest.js", function(exports, require, module) {
var app = undefined;
var DSView = require('models/dsview');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    name: '#inputname',
    mapFunction: '#inputmap',
    docType: '#inputdoctype',
    queryName: '#queryname',
    queryDocType: '#querydoctype',
    queryParams: '#queryparams',
  },

  events: {
    'change @ui.name': 'setParams',
    'change @ui.mapFunction': 'setParams',
    'change @ui.docType': 'setParams',
    'change @ui.queryParams': 'setParams',
    'click #inputsend': 'send',
  },

  modelEvents: {
    'change': 'updateView',
  },

  initialize: function() {
    app = require('application');

    this.listenTo(app, 'requestform:setView', this.setDSView);
  },

  setDSView: function(dsView) {
    this.model = dsView;
    // TODO : behavior .. ?
    this.updateView();
    this.send();

  },

  updateView: function() {
    this.ui.name.val(this.model.getName());
    this.ui.queryName.val(this.model.getName());
    this.ui.docType.val(this.model.getDocType());
    this.ui.queryDocType.val(this.model.getDocType());
    this.ui.mapFunction.val(this.model.getMapFunction());

    this.ui.queryParams.val(JSON.stringify(this.model.getQueryParams()));
  },

  setParams: function() {
    this.model = new DSView({
      name: this.ui.name.val(),
      mapFunction: this.ui.mapFunction.val(),
      docTypeOfView: this.ui.docType.val(),
      queryParams: JSON.parse(this.ui.queryParams.val()),
      createdAt: new Date().toISOString(),
    });

    this.model.updateDSView();
    this.updateView();
  },

  send: function() {
    if (!this.model) { return console.info('No DSView to request !');}

    var displayId = 'datarequest';
    var self = this;
    var model = this.model;
    return new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset') || !model.isNew()) {
        return resolve();
      }

      app.dsViews.create(model, {success: resolve, error: reject });
    })
    // .then(function() {
    //   // app.trigger('message:display', displayId,
    //     // 'Creation de la vue ' + model.getName());
    // })
    .then(model.updateDSView.bind(model))
    .then(function() {
      // app.trigger('message:hide', displayId);
      app.trigger('documents:fetch', model);
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error. Try again or check the console.');
    });
  },

});

});

require.register("views/groupsdsviews.js", function(exports, require, module) {
var GroupsView = require('lib/groupsview');

module.exports = GroupsView.extend({
  template: require('views/templates/groupsdsviews'),
  childViewContainer: '.dsviewslist>ul',
  groupBy: 'name',

  comparator: function(a, b) {
    return (a.get('createdAt') < b.get('createdAt')) ? 1: -1;
  },
  childView: require('views/dsview'),

  // behaviors: {
  //   Toggle: {},
  // }
});

});

require.register("views/message.js", function(exports, require, module) {
var app = null;

module.exports = Mn.ItemView.extend({
    tagName: 'div',
    template: require('views/templates/message'),

    ui: {
      message: '.display',
    },
    events: {
      'click .close': 'onClose',
    },

    initialize: function() {
      app = require('application');
      this.messages = {};
      this.listenTo(app, 'message:display', this.onDisplay);
      this.listenTo(app, 'message:hide', this.onHide);
      this.listenTo(app, 'message:error', this.onDisplay);
    },

    serializeData: function() {
      return { messages: this.messages  };
    },

    onError: function(message) {
      this.onDisplay(Math.ceil(Math.random() * 10000), message);
    },
    onDisplay: function(id, message) {
      this.messages[id] = message;
      this.render();
    },

    onClose: function(ev) {
      this.onHide(ev.currentTarget.dataset.messageid);
    },

    onHide: function(id) {
      delete this.messages[id];
      
      this.render();

    },

});

});

require.register("views/subsetitem.js", function(exports, require, module) {
module.exports = Mn.ItemView.extend({
    tagName: 'li',
    className: 'subset',

    template: require('views/templates/subsetitem'),

    events: {
      'click': 'setDSView',
    },

    setDSView: function() {
      require('application').trigger('requestform:setView', this.model);
    },

});

});

require.register("views/templates/app_layout.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<nav class=\"typologies navbar navbar-default\"></nav><div class=\"documentation\"></div><div class=\"row\"><div class=\"dsviewshistory col-xs-2\"></div><div class=\"col-xs-4\"><div class=\"requestform\"></div><div class=\"message\"></div></div><div class=\"documents col-xs-6\"></div></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/document.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (JSON, _result) {
buf.push("<span class=\"openBrace\">{</span><ul class=\"result\"><li>id:&nbsp;" + (jade.escape(null == (jade_interp = JSON.stringify(_result.id)) ? "" : jade_interp)) + ",</li><li>key:&nbsp;" + (jade.escape(null == (jade_interp = JSON.stringify(_result.key)) ? "" : jade_interp)) + ",</li><li>value:&nbsp;" + (jade.escape(null == (jade_interp = JSON.stringify(_result.value)) ? "" : jade_interp)) + ",</li><li class=\"doctype\">doc: {<div class=\"fields\"></div><span class=\"closeBrace\">},</span></li></ul><span class=\"closeBrace\">},</span>");}.call(this,"JSON" in locals_for_with?locals_for_with.JSON:typeof JSON!=="undefined"?JSON:undefined,"_result" in locals_for_with?locals_for_with._result:typeof _result!=="undefined"?_result:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/documentation.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (Description, Fréquence, Latence, Nom, Typologie, docType, subsets, synthSetInDS, synthSetInsertable, undefined) {
buf.push("<div class=\"title\"><span class=\"typologie\">" + (jade.escape(null == (jade_interp = Typologie) ? "" : jade_interp)) + "&nbsp;/&nbsp;</span><h2 class=\"subset\">" + (jade.escape(null == (jade_interp = Nom) ? "" : jade_interp)) + "</h2>");
if ( synthSetInsertable)
{
buf.push("<button type=\"button\" class=\"insert btn btn-primary\"><span class=\"iconicstroke-cloud-upload\"></span>&nbsp;Insérer dans le Cozy</button>");
}
if ( synthSetInDS)
{
buf.push("<button type=\"button\" class=\"delete btn btn-danger\"><span class=\"iconicstroke-trash-stroke\"></span>&nbsp;Supprimer du Cozy</button>");
}
buf.push("</div><div class=\"row\"> <div class=\"subset col-xs-6\"><p>" + (jade.escape(null == (jade_interp = Description) ? "" : jade_interp)) + "</p><ul class=\"caracteristiques\"><li><b>Fréquence :&nbsp;</b>" + (jade.escape(null == (jade_interp = Fréquence) ? "" : jade_interp)) + "</li><li><b>Latence :&nbsp;</b>" + (jade.escape(null == (jade_interp = Latence) ? "" : jade_interp)) + "</li></ul></div><div class=\"doctype col-xs-6\"><div class=\"well\">DocType :&nbsp;<b>" + (jade.escape(null == (jade_interp = docType.Nom) ? "" : jade_interp)) + "</b><p>" + (jade.escape(null == (jade_interp = docType.Description) ? "" : jade_interp)) + "</p><div class=\"similaires\">Du même type :<ul>");
// iterate subsets
;(function(){
  var $$obj = subsets;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var s = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = s.Nom) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var s = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = s.Nom) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ul></div></div></div></div>");}.call(this,"Description" in locals_for_with?locals_for_with.Description:typeof Description!=="undefined"?Description:undefined,"Fréquence" in locals_for_with?locals_for_with.Fréquence:typeof Fréquence!=="undefined"?Fréquence:undefined,"Latence" in locals_for_with?locals_for_with.Latence:typeof Latence!=="undefined"?Latence:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined,"Typologie" in locals_for_with?locals_for_with.Typologie:typeof Typologie!=="undefined"?Typologie:undefined,"docType" in locals_for_with?locals_for_with.docType:typeof docType!=="undefined"?docType:undefined,"subsets" in locals_for_with?locals_for_with.subsets:typeof subsets!=="undefined"?subsets:undefined,"synthSetInDS" in locals_for_with?locals_for_with.synthSetInDS:typeof synthSetInDS!=="undefined"?synthSetInDS:undefined,"synthSetInsertable" in locals_for_with?locals_for_with.synthSetInsertable:typeof synthSetInsertable!=="undefined"?synthSetInsertable:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/documents.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<h3>Données</h3><a id=\"downloaddata\" type=\"button\" target=\"_blank\" class=\"btn btn-default\">Télécharger</a><span class=\"openBracket\">[</span><ul class=\"documentslist\"></ul><span class=\"closeBracket\">]</span>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/dsview.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (name) {
buf.push("<h4>" + (jade.escape(null == (jade_interp = name) ? "" : jade_interp)) + "<span class=\"toggle\">&nbsp;</span></h4><div class=\"delete\">Supprimer cet historique &nbsp;<span title=\"Supprimer du Cozy\" class=\"iconicstroke-trash-stroke\"></span></div><ul class=\"history\"></ul>");}.call(this,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/dsviewhistoryitem.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (createdAt) {
buf.push("<span" + (jade.attr("title", createdAt, true, false)) + ">" + (jade.escape(null == (jade_interp = moment(createdAt).fromNow()) ? "" : jade_interp)) + "</span><span title=\"Supprimer du Cozy\" class=\"iconicstroke-trash-stroke delete\"></span>");}.call(this,"createdAt" in locals_for_with?locals_for_with.createdAt:typeof createdAt!=="undefined"?createdAt:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/field.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (Description, Format, JSON, Nom, value) {
buf.push("<span class=\"name\">" + (jade.escape(null == (jade_interp = Nom) ? "" : jade_interp)) + "</span>:&nbsp;<span" + (jade.cls(['value',typeof(value)], [null,true])) + ">" + (jade.escape(null == (jade_interp = JSON.stringify(value, null, 2)) ? "" : jade_interp)) + "</span><span>,</span>");
if ( Description || Format)
{
buf.push("<span class=\"toggle\"></span><ul class=\"details\"><span class=\"comment\">//&nbsp;</span>");
if ( Description)
{
buf.push("<li><b class=\"descriptionLabel\">Description :&nbsp;</b>" + (jade.escape(null == (jade_interp = Description) ? "" : jade_interp)) + "</li>");
}
if ( Format)
{
buf.push("<li><b>Format :&nbsp;</b>" + (jade.escape(null == (jade_interp = Format) ? "" : jade_interp)) + "</li>");
}
buf.push("</ul>");
}}.call(this,"Description" in locals_for_with?locals_for_with.Description:typeof Description!=="undefined"?Description:undefined,"Format" in locals_for_with?locals_for_with.Format:typeof Format!=="undefined"?Format:undefined,"JSON" in locals_for_with?locals_for_with.JSON:typeof JSON!=="undefined"?JSON:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined,"value" in locals_for_with?locals_for_with.value:typeof value!=="undefined"?value:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/formrequest.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<h3>Requêtes au datasystem</h3><div class=\"defineview\"><div class=\"method\">cozysdk.<b>defineView</b>(</div><ul><li><input id=\"inputdoctype\" type=\"text\" placeholder=\"DocType\" name=\"doctype\" value=\"Event\" class=\"param\"/><span>,</span></li><li><input id=\"inputname\" type=\"text\" placeholder=\"Name\" name=\"name\" value=\"MyRequest\" class=\"param\"/><span>,</span></li><li><textarea id=\"inputmap\" placeholder=\"\" rows=\"3\">function(doc) {\n  emit(doc._id);\n}</textarea><span>\");</span></li></ul></div><div class=\"queryview\"><div class=\"method\">cozysdk.<b>queryView</b>(</div><ul><li><input id=\"querydoctype\" type=\"text\" readonly=\"readonly\" class=\"param\"/><span>,</span></li><li><input id=\"queryname\" type=\"text\" readonly=\"readonly\" class=\"param\"/><span>,</span></li><li><textarea id=\"queryparams\" placeholder=\"\" rows=\"5\">{\n  include_docs: true,\n  limit: 5,\n}</textarea><span>\");</span></li></ul></div><button id=\"inputsend\" class=\"btn btn-success\">Envoyer →</button>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/groupsdsviews.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<h3>Historique des requêtes</h3><div class=\"dsviewslist\"><ul></ul></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/message.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (messages, undefined) {
jade_mixins["displayMessage"] = jade_interp = function(id, m){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<li><span class=\"display\">" + (jade.escape(null == (jade_interp = m) ? "" : jade_interp)) + "</span><span" + (jade.attr("data-messageid", id, true, false)) + " class=\"close\">X</span></li>");
};
if ( (messages.length != 0))
{
buf.push("<ul>");
// iterate messages
;(function(){
  var $$obj = messages;
  if ('number' == typeof $$obj.length) {

    for (var id = 0, $$l = $$obj.length; id < $$l; id++) {
      var message = $$obj[id];

jade_mixins["displayMessage"](id, message);
    }

  } else {
    var $$l = 0;
    for (var id in $$obj) {
      $$l++;      var message = $$obj[id];

jade_mixins["displayMessage"](id, message);
    }

  }
}).call(this);

buf.push("</ul>");
}}.call(this,"messages" in locals_for_with?locals_for_with.messages:typeof messages!=="undefined"?messages:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/subsetitem.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (Détenteur, Nom) {
buf.push("<span class=\"imgcontainer\"><img" + (jade.attr("src", 'img/holders/logo_' + Détenteur.toLowerCase() + '.png', true, false)) + (jade.attr("title", Détenteur, true, false)) + "/></span><span class=\"name\">" + (jade.escape(null == (jade_interp = Nom) ? "" : jade_interp)) + "</span>");}.call(this,"Détenteur" in locals_for_with?locals_for_with.Détenteur:typeof Détenteur!=="undefined"?Détenteur:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/typologies.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"navbar-header\"><img src=\"img/logo_mesinfos.png\"/></div><div class=\"collapse navbar-collapse\"><ul class=\"typologies nav navbar-nav\"></ul></div>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/typology.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (groupTitle) {
buf.push("<a" + (jade.attr("id", 'dropdown' + groupTitle, true, false)) + " href=\"#\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\" class=\"dropdown-toggle\">" + (jade.escape(null == (jade_interp = groupTitle) ? "" : jade_interp)) + "<b class=\"caret\"></b></a><ul" + (jade.attr("aria-labelledby", 'dropdown' + groupTitle, true, false)) + " class=\"dropdown-menu\"></ul>");}.call(this,"groupTitle" in locals_for_with?locals_for_with.groupTitle:typeof groupTitle!=="undefined"?groupTitle:undefined));;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/typologies.js", function(exports, require, module) {
var GroupsView = require('lib/groupsview');

module.exports = GroupsView.extend({
  template: require('views/templates/typologies'),
  tagName: 'div',
  className: 'container-fluid',
  childViewContainer: 'ul.typologies',

  groupBy: 'Typologie',
  comparator: 'Nom',

  childView: Mn.CompositeView.extend({
    tagName: 'li',
    className: 'dropdown',
    template: require('views/templates/typology'),
    childViewContainer: 'ul',
    childView: require('views/subsetitem'),
  }),

});

});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map