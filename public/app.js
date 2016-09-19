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

    // Deactivate
    return Promise.resolve();
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
    this.fetch({ reset: true });
  },

  setDSView: function(dsView) {
    this.dsView = dsView;
  },

  toRawJSON: function() {
    return this.map(function(doc) {
      var res = doc.toJSON();
      delete res.fields;
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

require.register("lib/groupbyprojection.js", function(exports, require, module) {
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
    return 'mesinfosdataplayground' + '-' + '0.0.1';
  },
}

});

;require.register("models/dsview.js", function(exports, require, module) {
var appName = require('lib/utils').appNameNVersion;

module.exports = Backbone.Model.extend({
  docType: 'DSView',

  defaults: {
    docTypeVersion: appName(),
  },
  initialize: function() {
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
    var self = this;
    return cozysdk.defineView(this.getDocType(),
      this.getName(),
      this.getMapFunction()).then(function(err) {
        cozysdk.run(self.getDocType(), self.getName(), { limit: 1 });
      });
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
// },
// {// Class properties

//   fetchSingleton: function() {
//     var self = this;
//     return cozysdk.defineView(Properties.prototype.docType, 'all',
//       'function(doc) { emit(doc._id);}'
//     ).then(function() {
//         return cozysdk.queryView(Properties.prototype.docType, 'all', {limit: 1, include_docs: true}); }
//     ).then(function(res) {
//       return new Properties((res && res.length !== 0) ? res[0].doc : {});
//     });
//   },
});


module.exports = new Properties();

});

require.register("models/subset.js", function(exports, require, module) {
var DSView = require('models/dsview');
var utils = require('lib/utils');

module.exports = DSView.extend({
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
    var app = require('application');
    var self = this;
    if (!this.synthSetAvailable()) { return Promise.resolve(false); }

    return Promise.resolve($.getJSON('data/'+ self.getSynthSetName() +'.json'))
    .then(function(raw) {
      return Promise.all(raw.map(self._insertOneSynthDoc, self));
    }).then(function(ids) {
      ids = ids.map(function(obj) { return obj._id; });
      
      return app.properties.addSynthSetIds(self.getSynthSetName(), ids)
    }).catch(function(err) {
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
    var self = this;
    return Promise.all(self.get('synthSetIds').map(
      function(id) { return cozysdk.destroy(self.getDocType(), id); })
    ).then(console.log).catch(console.log).then(function(res) {
      var app = require('application');
      app.properties.cleanSynthSetIds(self.getSynthSetName());
    });
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
    typologies: 'aside .typologies',
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
    this.requestForm.show(new RequestForm({ model: new DSView() }));
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

require.register("views/documentfields.js", function(exports, require, module) {
module.exports = Mn.CompositeView.extend({
  tagName: 'li',
  className: 'doctype',
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
    this.listenTo(this.collection, 'reset', this.render);
  },

  serializeData: function() {
    var data = { docType: {}, subsets: []};
    try {
    if (this.collection && this.collection.dsView) {
      console.log('here');
      var model = this.collection.dsView;
      console.log('here1');
      data.docType = app.docTypes.findWhere({ 'Nom': model.getDocType()}).toJSON();
      console.log('here2');
      console.log(app.subsets);

      data.subsets = app.subsets.where({'DocType': model.getDocType()})
        .map(function(subset) { return subset.toJSON(); });
      console.log('here3');

    }
    console.log(data);
  } catch (e) { console.log(e);}
     return data;
  },

  updateDownloadButton: function() {
    // Add data to the download button
    var app = require('application');

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
    
  },

  updateView: function() {
    console.debug('updateView');
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
  },

  send: function() {
    var self = this;
    var model = this.model;
    return new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset') || !model.isNew()) {
        return resolve();
      }

      app.dsViews.create(model, {success: resolve, error: reject });
    })
    .then(function() {
      app.trigger('message:display', 'Creation de la vue ' + model.getName());
    })
    .then(model.updateDSView.bind(model))
    .then(function() {
      app.trigger('message:hide');
      app.trigger('documents:fetch', model);
    })
    .catch(function(err) {
      console.log(err);
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
      'click .close': 'onHide',
    },

    initialize: function() {
      app = require('application');
      this.listenTo(app, 'message:display', this.onDisplay);
      this.listenTo(app, 'message:hide', this.onHide);
      this.listenTo(app, 'message:error', this.onDisplay);
    },

    onDisplay: function(message) {
      console.log("display");
      console.log(arguments);
      // this.$el.css('display', 'block');

      this.ui.message.text(message);
    },

    onHide: function() {
      console.log('hide');
      this.ui.message.empty();
      // $(this.el.css('display', 'none');

    }

});

});

require.register("views/subsetitem.js", function(exports, require, module) {
module.exports = Mn.ItemView.extend({
    tagName: 'li',

    template: require('views/templates/subsetitem'),

    events: {
      'click h4': 'setDSView',
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

});

require.register("views/templates/app_layout.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"header\"><div class=\"requestform\"></div></div><div class=\"dsviewshistory\"></div><div class=\"message\"></div><div class=\"documents\"></div><aside class=\"typologies\"><h2>Les données du pilote MesInfos<div class=\"subTitle\">Jeux de synthèse</div></h2><div class=\"typologies\"></div></aside>");;return buf.join("");
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

buf.push("<span class=\"openBrace\">{</span><div class=\"fields\"></div><span class=\"closeBrace\">},</span>");;return buf.join("");
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
;var locals_for_with = (locals || {});(function (docType, subsets, undefined) {
jade_mixins["displaySubset"] = jade_interp = function(s){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<li><h4>" + (jade.escape(null == (jade_interp = s.Nom) ? "" : jade_interp)) + "&nbsp;(origine :&nbsp; " + (jade.escape(null == (jade_interp = s.Détenteur) ? "" : jade_interp)) + ") </h4><p>" + (jade.escape(null == (jade_interp = s.Description) ? "" : jade_interp)) + "</p><ul class=\"caracteristics\"><li><b>Fréquence : </b>" + (jade.escape(null == (jade_interp = s.Fréquence) ? "" : jade_interp)) + "</li><li><b>Latence :</b>" + (jade.escape(null == (jade_interp = s.Latence) ? "" : jade_interp)) + "</li></ul></li>");
};
buf.push("<div class=\"doctypedoc\"><h4>DocType</h4>" + (jade.escape(null == (jade_interp = docType.Nom) ? "" : jade_interp)) + "<p>" + (jade.escape(null == (jade_interp = docType.Description) ? "" : jade_interp)) + "</p>Sous-ensembles du même type :<ul>");
// iterate subsets
;(function(){
  var $$obj = subsets;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var subset = $$obj[$index];

jade_mixins["displaySubset"](subset);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var subset = $$obj[$index];

jade_mixins["displaySubset"](subset);
    }

  }
}).call(this);

buf.push("</ul></div><a id=\"downloaddata\" target=\"_blank\">Télécharger</a><ul class=\"documentslist\"></ul>");}.call(this,"docType" in locals_for_with?locals_for_with.docType:typeof docType!=="undefined"?docType:undefined,"subsets" in locals_for_with?locals_for_with.subsets:typeof subsets!=="undefined"?subsets:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
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
;var locals_for_with = (locals || {});(function (Attention, Description, Format, JSON, Nom, value) {
buf.push("<span>\"</span><span class=\"name\">" + (jade.escape(null == (jade_interp = Nom) ? "" : jade_interp)) + "</span><span>\"</span>:&nbsp;<span" + (jade.cls(['value',typeof(value)], [null,true])) + ">" + (jade.escape(null == (jade_interp = JSON.stringify(value)) ? "" : jade_interp)) + "</span><span class=\"toggle\">,</span>");
if ( Attention)
{
buf.push("<span class=\"caution\">//&nbsp;\n= Attention</span>");
}
buf.push("<ul class=\"details\"><li><b>Description :&nbsp;</b>" + (jade.escape(null == (jade_interp = Description) ? "" : jade_interp)) + "</li><li><b>Format :&nbsp;</b>" + (jade.escape(null == (jade_interp = Format) ? "" : jade_interp)) + "</li></ul>");}.call(this,"Attention" in locals_for_with?locals_for_with.Attention:typeof Attention!=="undefined"?Attention:undefined,"Description" in locals_for_with?locals_for_with.Description:typeof Description!=="undefined"?Description:undefined,"Format" in locals_for_with?locals_for_with.Format:typeof Format!=="undefined"?Format:undefined,"JSON" in locals_for_with?locals_for_with.JSON:typeof JSON!=="undefined"?JSON:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined,"value" in locals_for_with?locals_for_with.value:typeof value!=="undefined"?value:undefined));;return buf.join("");
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

buf.push("<h2>Requêtes au datasystem</h2><div class=\"defineview\"><div class=\"method\">cozysdk.<b>defineView</b>(</div><ul><li><input id=\"inputdoctype\" type=\"text\" placeholder=\"DocType\" name=\"doctype\" value=\"Event\" class=\"param\"/><span>,</span></li><li><input id=\"inputname\" type=\"text\" placeholder=\"Name\" name=\"name\" value=\"MyRequest\" class=\"param\"/><span>,</span></li><li><textarea id=\"inputmap\" placeholder=\"\" row=\"5\">function(doc) {\n  emit(doc._id);\n}</textarea><span>\");</span></li></ul></div><div class=\"queryview\"><div class=\"method\">cozysdk.<b>queryView</b>(</div><ul><li><input id=\"querydoctype\" type=\"text\" readonly=\"readonly\" class=\"param\"/><span>,</span></li><li><input id=\"queryname\" type=\"text\" readonly=\"readonly\" class=\"param\"/><span>,</span></li><li><textarea id=\"queryparams\" placeholder=\"\" row=\"5\">{\n  include_docs: true,\n  limit: 5,\n}</textarea><span>\");</span></li></ul></div><button id=\"inputsend\">Envoyer</button>");;return buf.join("");
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

buf.push("<h3>Historique</h3><div class=\"dsviewslist\"><ul></ul></div>");;return buf.join("");
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

buf.push("<span class=\"close\">X</span><span class=\"display\"></span>");;return buf.join("");
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
;var locals_for_with = (locals || {});(function (Détenteur, Nom, synthSetInDS, synthSetInsertable) {
buf.push("<h4 class=\"subset\"><span class=\"name\">" + (jade.escape(null == (jade_interp = Nom) ? "" : jade_interp)) + "</span><img" + (jade.attr("src", 'img/holders/logo_' + Détenteur.toLowerCase() + '.png', true, false)) + (jade.attr("title", Détenteur, true, false)) + "/>");
if ( synthSetInsertable)
{
buf.push("<span title=\"Insérer dans le Cozy\" class=\"iconicstroke-cloud-upload insert\"></span>");
}
if ( synthSetInDS)
{
buf.push("<span title=\"Supprimer du Cozy\" class=\"iconicstroke-trash-stroke delete\"></span>");
}
buf.push("</h4>");}.call(this,"Détenteur" in locals_for_with?locals_for_with.Détenteur:typeof Détenteur!=="undefined"?Détenteur:undefined,"Nom" in locals_for_with?locals_for_with.Nom:typeof Nom!=="undefined"?Nom:undefined,"synthSetInDS" in locals_for_with?locals_for_with.synthSetInDS:typeof synthSetInDS!=="undefined"?synthSetInDS:undefined,"synthSetInsertable" in locals_for_with?locals_for_with.synthSetInsertable:typeof synthSetInsertable!=="undefined"?synthSetInsertable:undefined));;return buf.join("");
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
buf.push("<h3>" + (jade.escape(null == (jade_interp = groupTitle) ? "" : jade_interp)) + "</h3><ul></ul>");}.call(this,"groupTitle" in locals_for_with?locals_for_with.groupTitle:typeof groupTitle!=="undefined"?groupTitle:undefined));;return buf.join("");
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
  tagName: 'ul',
  groupBy: 'Typologie',
  comparator: 'Nom',

  childView: Mn.CompositeView.extend({
    tagName: 'li',
    template: require('views/templates/typology'),
    childViewContainer: 'ul',
    childView: require('views/subsetitem'),
  }),

});

});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map