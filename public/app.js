(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

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
    var hot = hmr && hmr.createHot(name);
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
    if (bundle && typeof bundle === 'object') {
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
var global = typeof window === 'undefined' ? this : window;
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
var semutils = require('lib/semantic_utils');

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
    var app = $('[role=application]')[0];
    cozy.client.init({
      cozyURL: '//' + app.dataset.cozyDomain,
      token: app.dataset.cozyToken,
    });

    // cozy.bar.init({appName: "MesInfos-Dev"});

    return this._fetchDocumentation()
  },

  prepareInBackground: function() {
    this.properties.fetch();

    // return this._defineViews();
  },

  _fetchDocumentation: function(data) {
    'use-strict'
    return Promise.all([
      $.getJSON('data/wikiapi/items.json'),
      $.getJSON('data/wikiapi/mesinfos_subsets.json'),
      $.getJSON('data/wikiapi/cozy_doctypes.json'),
    ])
    .then((res) => {
      this.wikiapi = res[0]

      this.subsets = new SubsetsCollection()
      this.subsets.addByWikidataIds(res[1]['schema:itemListElement'])

      this.doctypes = semutils.mapByProp('cozyDoctypeName', res[2]['schema:itemListElement'], this.wikiapi)
    })

    // var metadata = data["export"];
    // this.subsets = new SubsetsCollection(metadata.filter(function(field) {
    //   return field.Nature === 'Subset';
    // }));
    // this.docTypes = new Backbone.Collection(metadata.filter(function(field) {
    //   return field.Nature === 'DocType';
    //
    // }));
    // this.fields = metadata.filter(function(field) {
    //   return field.Nature !== 'Subset' && field.Nature !== 'DocType';
    // });
  },

  // _parseMetadata: function(data) {
  //   var metadata = data["export"];
  //   this.subsets = new SubsetsCollection(metadata.filter(function(field) {
  //     return field.Nature === 'Subset';
  //   }));
  //   this.docTypes = new Backbone.Collection(metadata.filter(function(field) {
  //     return field.Nature === 'DocType';
  //
  //   }));
  //   this.fields = metadata.filter(function(field) {
  //     return field.Nature !== 'Subset' && field.Nature !== 'DocType';
  //   });
  // },

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
    // this.trigger('requestform:setView', this.subsets.at(randomIndex));
  },

});

var application = new Application();

module.exports = application;
window.app = application;

document.addEventListener('DOMContentLoaded', function() {
  application.prepare()
    .then(function() { application.prepareInBackground();})
    .then(application.start.bind(application));
});

});

require.register("collections/documents.js", function(exports, require, module) {
var semutils = require('lib/semantic_utils')

module.exports = Backbone.Collection.extend({


  initialize: function() {
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
      return res;
    });
  },

  // Generate fields, with the metadata !
  parse: function(resp, options) {
    return resp.map(this._generateFields.bind(this));
  },

  _generateFieldsOfObject: function (obj, metaObject) {
    'use-strict'
    let metaProps = []
    if (metaObject.hasOptionalProperty) {
      metaProps = metaProps.concat(metaObject.hasOptionalProperty)
    }
    if (metaObject.hasProperty) {
      metaProps = metaProps.concat(metaObject.hasProperty)
    }
    const metaPropByName = semutils.mapByProp('name', metaProps, app.wikiapi)

    return Object.keys(obj).map((prop) => {
      const metaProp = metaPropByName[prop]
      let field = { name: prop, value: obj[prop] }
      if (metaProp) {
        field = $.extend(field, metaProp)
      }

      if (semutils.isType(metaProp, 'object')) {
        field.displayType = 'object'
        field.value = this._generateFieldsOfObject(obj[prop], metaProp)
      } else if (semutils.isType(metaProp, 'array')) {
        field.displayType = 'array'
        // TODO : metaProps.items may be a array (in the future)
        field.value = obj[prop].map((propItem) => this._generateFieldsOfObject(propItem, semutils.getItem(metaProp.items, app.wikiapi)))
      } else {
        field.value = obj[prop]
      }

      return field
    }).sort(function(a, b) {
      if (a.kind === 'Metadata' && b.kind !== 'Metadata') {
          return 1;
      } else if (a.kind !== 'Metadata' && b.kind === 'Metadata') {
          return -1;
      } else {
          return a.name > b.name ? 1 : -1;
      }
    })
  },

  _generateFields: function(doc) {
    'use-strict'
    const docType = app.doctypes[this.dsView.getDocType()]
    doc.fields = this._generateFieldsOfObject(doc, docType)
    return doc;
  },

  // _generateFields: function(doc) {
  //   var docType = this.dsView.getDocType();
  //   var fieldsDocumentation = app.fields.filter(function(field) {
  //     // TODO : origin too ?
  //     // TOOD : update V3
  //     // return field.DocType.toLowerCase() === doc.docType.toLowerCase();
  //     return field.DocType === docType;
  //   });
  //
  //   var viewedFields = {};
  //   var fields = fieldsDocumentation.reduce(function(agg, field) {
  //     if (!doc[field.Nom]) { return agg; }
  //
  //     viewedFields[field.Nom] = true;
  //     var f = $.extend({}, field);
  //     f.value = doc[field.Nom];
  //     agg.push(f);
  //     return agg;
  //   }, []);
  //
  //   for (var k in doc) {
  //     if (!(k in viewedFields)) {
  //       fields.push({ Nom: k, value: doc[k] })
  //     }
  //   }
  //
  //   fields.sort(function(a, b) {
  //     if (a.Nature === 'Metadata' && b.Nature !== 'Metadata') {
  //         return 1;
  //     } else if (a.Nature !== 'Metadata' && b.Nature === 'Metadata') {
  //         return -1;
  //     } else {
  //         return a.Nom > b.Nom ? 1 : -1;
  //     }
  //   });
  //   doc.fields = fields;
  //
  //   return doc;
  // },

  // override sync

  sync: function(method, collection, options) {
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }

      return;
    }

    return cozy.client.data.query(this.dsView.index, this.dsView.getQueryParams())
    .then(options.success, options.error);
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

    cozy.client.data.defineIndex(docType, ['_id'])
    .then(function(index) {
      return cozy.client.data.query(index, { selector: { _id: '' }});
    })
    .then(options.success, options.error);
  },

});

});

require.register("collections/subsets.js", function(exports, require, module) {
'use-strict'

const Model = require('models/subset')

module.exports = Backbone.Collection.extend({
  model: Model,

  initialize: function() {
    app = require('application')
    this.listenTo(app.properties, 'change', this.updateSynthSetsStatus)
  },

  updateSynthSetsStatus: function() {
    synthSetProperty = app.properties.get('synthSets')

    this.forEach(function(subset) {
      if (subset.getSynthSetName() in synthSetProperty) {
        subset.set('synthSetIds', synthSetProperty[subset.getSynthSetName()])
      }
    });
  },

  addByWikidataIds: function (ids) {
    ids.forEach((id) => {
      this.add(app.wikiapi[id])
    })
  },


});

});

require.register("lib/appname_version.js", function(exports, require, module) {
'use-strict';

const name = 'lamusiquedemesfilms';
// use brunch-version plugin to populate these.
const version = '4.0.0';

module.exports = `${name}-${version}`;

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

;require.register("lib/backbone_cozymodel.js", function(exports, require, module) {
'use-strict';

const appName = require('../lib/appname_version');

module.exports = Backbone.Model.extend({
  docType: '',
  defaults: {
    docTypeVersion: appName,
  },

  parse: function (raw) {
    raw.id = raw._id;
    return raw;
  },

  sync: function (method, model, options) {
    return this.syncPromise(method, model, options)
    .then(options.success, (err) => {
        console.log(err);
        options.error(err);
      });
  },

  syncPromise: function (method, model, options) {
    console.log(model);
    if (method === 'create') {
      return cozy.client.data.create(this.docType, model.attributes)
    } else if (method === 'update') {
      // TODO !!
      return cozy.client.data.update(this.docType, model.attributes, model.attributes)
    } else if (method === 'patch') {
      // TODO !!
      return cozy.client.data.updateAttributes(this.docType, model.attributes_id, model.attributes)
    } else if (method === 'delete') {
      return cozy.client.data.delete(this.docType, model.attributes)
    } else if (method === 'read') {
      return cozy.client.find(this.docType, model.attributes._id)
    }
  },
});

});

require.register("lib/backbone_cozysingleton.js", function(exports, require, module) {
'use-strict';

const CozyModel = require('./backbone_cozymodel');

module.exports = CozyModel.extend({
  sync: function (method, model, options) {
    if (method === 'read' && model.isNew()) {
      return cozy.client.data.defineIndex(this.docType.toLowerCase(), ['_id'])
      .then((index) => {
        return cozy.client.data.query(index, { selector: { _id: { $gt: null } }, limit: 1 });
      })
      .then(res => ((res && res.length !== 0) ? res[0] : {}))
      .then(options.success, function(err) {
        console.error(err);
        return options.error(err);
      });
    }

    return CozyModel.prototype.sync.call(this, method, model, options);
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

require.register("lib/semantic_utils.js", function(exports, require, module) {
'use-strict'
const M = {}

M.getItem = (item, allItems) => {
  // TODO : clean this !
  const MetaObject = require('../models/metaobject')
  let attrs = {}
  if (typeof item === 'string') { // it's an id !
    attrs = allItems[item]
  } else {
    attrs = allItems[item['@id']]
  }

  return new MetaObject(attrs)
}

M.idList2ItemMap = (ids, allItems) => {
  return ids.reduce((agg, id) => {
    agg[id] = allItems[id]
    return agg
  }, {})
}

M.mapByProp = (prop, items, allItems) => {
  return items.reduce((agg, id) => {
    try {
      const item = M.getItem(id, allItems)
      agg[item[prop]] = item
      return agg
    } catch (e) {
      console.error(`semantic_utils : Error in map by prop on id: ${id}`, e)
      throw e
    }
  }, {})
}

M.isType = (item, type) => {
  if (!(item && item['@type'])) { return false }

  const typeProp = item['@type']
  return  typeProp === type || (typeProp instanceof Array && typeProp.indexOf(type) !== -1)
}

M.mapOnPropValue = (propValue, fun) => {
  if (propValue instanceof Array) {
    return propValue.map(fun)
  }
  return fun(propValue)
}

M.fillTreeForProps = (item, props, allItems) => {

  item = M.getItem(item, allItems)
  props.forEach((prop) => {
    if (item[prop]) {
      item[prop] = M.mapOnPropValue(item[prop], (value) => M.fillTreeForProps(value, props, allItems))
    }
  })

  return item
}

module.exports = M

});

;require.register("lib/utils.js", function(exports, require, module) {
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
var CozyModel = require('../lib/backbone_cozymodel');
var utils = require('../lib/utils');

module.exports = CozyModel.extend({
  docType: 'org.fing.mesinfos.mesinfos-dev.dsview',

  // getQualifiedDocType: function() {
  //   return 'org.fing.mesinfos.mesinfos-dev.' + this.getDocType();
  // },

  getDocType: function() {
    return this.get('docTypeOfView');
  },

  getName: function() {
    return this.getDocType() + '_' + this.getIndexFields().join('_');
  },

  getIndexFields: function() {
    // TODO : handle doctype version / migration ?
    var fields = this.get('indexFields');
    return Array.isArray(fields) ? fields : [];
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

    return cozy.client.data.defineIndex(this.getDocType(), this.getIndexFields())
    .then(function(index) {
      self.index = index;

      app.trigger('message:display', displayId, 'initialize ' + self.getName());
      // this is just an prefetch (real query done in collections/documents.)
      cozy.client.data.query(self.index, self.getQueryParams());
      })
    .then(function() {
      app.trigger('message:display', displayId, self.getName() + ' màj en '
       + (Date.now() - start) / 1000 + 's.');
    })
    .catch(utils.generateDisplayError(
      'Erreur pendant updateView ' + self.getName()));
  },
});

});

require.register("models/metaobject.js", function(exports, require, module) {
'use-strict'

semutils = require('../lib/semantic_utils')

// prototype for metaobject deserialized from json-ld read-only data.
module.exports = class MetaObject {
  constructor(attrs) {
    $.extend(this, attrs)
  }

  get allProperties () {
    let props = []
    if (this.hasProperty) {
      semutils.mapOnPropValue(this.hasProperty, (prop) => props.push(prop))
    }

    if (this.hasOptionalProperty) {
      semutils.mapOnPropValue(this.hasOptionalProperty, (prop) => props.push(prop))
    }
    return props
  }
}

});

;require.register("models/properties.js", function(exports, require, module) {
var CozySingleton = require('../lib/backbone_cozysingleton');

var Properties = CozySingleton.extend({
  docType: 'org.fing.mesinfos.mesinfos-dev.properties',
  defaults: _.extend({
    synthSets: {},
  }, CozySingleton.defaults),

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
'use-strict'

const DSView = require('models/dsview')
const utils = require('lib/utils')
var ap = require('lib/asyncpromise')

module.exports = DSView.extend({
  getDocType: function() {
    return this.get('cozyDoctypeName');
  },

  getName: function() {
    return utils.slugify(this.get('name'));
  },

  getIndexFields: function() {
    return JSON.parse(this.get('cozyIndex'));
  },

  getQueryParams: function() {
    return {
      selector: JSON.parse(this.get('cozySelector')),
      limit: 10
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
    // We assume her ethat syntheticet is a url like that :
    //  "https://raw.githubusercontent.com/jacquarg/mesinfos-dev3/master/data/consommation_electrique.json"
    return this.has('syntheticSet') ? this.get('syntheticSet').slice(63) : undefined;
  },

  insertSynthSet: function() {
    var displayId = 'insertsynthset';
    var self = this;
    if (!this.synthSetAvailable()) { return Promise.resolve(false); }
    return Promise.resolve($.getJSON(self.getSynthSetName()))
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
      self.trigger('synthsetInserted');
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error while processing data. Retry or check console.');
    });

  },

  _insertOneSynthDoc: function(row) {
    delete row._id;
    delete row.id;
    delete row._rev;
    delete row.docType;
    return cozy.client.data.create(this.getDocType(), row);
  },

  cleanSynthSet: function() {
    var displayId = 'deletesynthset';
    var self = this;

    var count = self.get('synthSetIds').length;

    return ap.series(self.get('synthSetIds'), function(id, index) {
        app.trigger('message:display', displayId, 'Suppression des documents '
         + self.getDocType() + ' de synthèse ' + index + '/' + count);
        return cozy.client.data.find(self.getDocType(), id)
        .then(function(doc) {
          return cozy.client.data.delete(self.getDocType(), doc);
        });
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

require.register("views/add_synthset_file.js", function(exports, require, module) {
var app = undefined;
var template = require('views/templates/add_synthset_file');
var ap = require('lib/asyncpromise');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: template,
  ui: {
    fileInput: "input",
  },
  events: {
    "change @ui.fileInput": "onFileChange",
  },

  initialize: function() {
    app = require('application');
  },

  onFileChange: function (e) {
    var reader = new FileReader();
    var self = this;
    reader.addEventListener('load', function() {
      console.log(JSON.parse(reader.result));
      self.insertSynthSet(JSON.parse(reader.result));
      //      alert('Contenu du fichier "' + fileInput.files[0].name + '" :\n\n' + reader.result);
    });
    console.log(this.ui.fileInput)

    reader.readAsText(this.ui.fileInput[0].files[0]);
  },

  insertSynthSet: function(raw) {
    // TODO : use subset to handle destroy ? / remove

    var displayId = 'insertsynthset';
    var self = this;
    var count = raw.length;
    return ap.series(raw, function(doc, index) {
      app.trigger('message:display', displayId, 'Ajout de documents '
       + "TODO" + ' de synthèse ' + index + '/' + count);
      return self._insertOneSynthDoc(doc);
    })
    .then(function() {
      app.trigger('message:hide', displayId);
      self.trigger('synthsetInserted');
    })
    .catch(function(err) {
      console.error(err);
      app.trigger('message:error', 'Error while processing data. Retry or check console.');
    });
  },

  _insertOneSynthDoc: function(row) {
    var docType = row.docType;
    // Clean the document
    delete row._id;
    delete row.id;
    delete row._rev;
    delete row.docType;

    // and then, insert it !
    return cozy.client.data.create(docType, row);
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
var AddSynthSetFile = require('views/add_synthset_file');
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
    fileinput: '.fileinput',
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
    this.fileinput.show(new AddSynthSetFile());
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

require.register("views/document.js", function(exports, require, module) {
'use-strict'

const semutils = require('../lib/semantic_utils')
const template = require('views/templates/document')

module.exports = Mn.ItemView.extend({
  tagName: 'li',
  template: template,
  className: 'doctype',

  events: {
    'click .toggle': 'toggleDetails',
  },

  toggleDetails: function (ev) {
    const fieldElem = $(ev.currentTarget).parent()
    fieldElem.toggleClass('compact')
    fieldElem.toggleClass('expanded')
  },

});

});

require.register("views/documentation.js", function(exports, require, module) {
var app = undefined;
var semutils = require('lib/semantic_utils');

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
      data.docType = app.doctypes[this.model.get('cozyDoctypeName')];
      data.subsets = app.subsets.where({'cozyDoctypeName': this.model.getDocType()})

        .map(function(subset) { return subset.toJSON(); });

      data = $.extend(data, semutils.fillTreeForProps(data, ['hasProperty', 'hasOptionalProperty', 'items'], app.wikiapi))
      // if (data.hasProperty) {
      //   data.hasProperty = data.hasProperty.map(item => semutils.getItem(item, app.wikiapi))
      // }
      if (data.updateFrequency) {
        data.updateFrequency = moment.duration(data.updateFrequency).humanize()
      }
      if (data.updateLatency) {
        data.updateLatency = moment.duration(data.updateLatency).humanize()
      }
    }
    return data;
  },

  _buildPlainDocTree: function () {

  },

  insertSynthSet: function() {
    this.model.insertSynthSet();
    this.listenToOnce(this.model, 'synthsetInserted', function() {
      app.trigger('requestform:setView', this.model);
    }.bind(this));
  },

  destroySynthSet: function() {
    this.model.cleanSynthSet();
  },

});

});

require.register("views/documents.js", function(exports, require, module) {
var app = null;

module.exports = Mn.CompositeView.extend({
  tagName: 'div',
  template: require('views/templates/documents'),

  childView: require('views/document'),
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

  serializeData: function() {
    var model = this.collection.first();
    var data = model.toJSON();
    data.name = model.getName();
    return data;
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

require.register("views/formrequest.js", function(exports, require, module) {
var app = undefined;
var DSView = require('models/dsview');

module.exports = Mn.ItemView.extend({

  tagName: 'div',
  template: require('views/templates/formrequest'),

  ui: {
    indexFields: '#inputfields',
    docType: '#inputdoctype',
    queryParams: '#queryparams',
  },

  events: {
    'change @ui.indexFields': 'setParams',
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
    this.ui.docType.val(this.model.getDocType());
    this.ui.indexFields.val(this.model.getIndexFields());
    this.ui.queryParams.val(JSON.stringify(this.model.getQueryParams()));
  },

  setParams: function() {
    console.debug('estparams')
    this.model = new DSView({
      docTypeOfView: this.ui.docType.val(),
      indexFields: this.ui.indexFields.val().split(',').map(function(field) { return field.trim(); }),
      queryParams: JSON.parse(this.ui.queryParams.val()),
      createdAt: new Date().toISOString(),
    });

    //this.model.updateDSView();
    this.updateView();
    console.log(this.model)
  },

  send: function() {
    if (!this.model) {
    // TODO !!        return console.info('No DSView to request !');
      this.model = new DSView();
    }

    var displayId = 'datarequest';
    var self = this;
    var model = this.model;
    return new Promise(function(resolve, reject) {
      if (model instanceof require('models/subset') || !model.isNew()) {
        return resolve();
      }
      console.log('here')
      app.dsViews.create(model, {success: resolve, error: reject });
    })
    //
    //.then(function() {
    //  console.log('here2')

    //   // app.trigger('message:display', displayId,
    //     // 'Creation de la vue ' + model.getName());
    //})
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

require.register("views/templates/add_synthset_file.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<h4>Ajouter des données dans le Cozy</h4><input type=\"file\" id=\"inputsynthsetfile\"/>");;return buf.join("");
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

;require.register("views/templates/app_layout.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<nav class=\"typologies navbar navbar-default\"></nav><div class=\"row\"><div class=\"col-sm-6 col-lg-5\"><div class=\"documentation\"></div><div class=\"dsviewshistory\"></div><div class=\"fileinput\"></div></div><div class=\"col-sm-6 col-lg-7\"><div class=\"requestform\"></div><div class=\"message\"></div></div><div class=\"documents col-lg-6 col-sm-12\"></div></div>");;return buf.join("");
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
;var locals_for_with = (locals || {});(function (Array, JSON, fields) {
jade_mixins["obj"] = jade_interp = function(fieldList){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<span class=\"openBrace\">{</span><div class=\"fields\">");
// iterate fieldList
;(function(){
  var $$obj = fieldList;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

jade_mixins["field"](field);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

jade_mixins["field"](field);
    }

  }
}).call(this);

buf.push("</div><span class=\"closeBrace\">}</span>");
};
jade_mixins["field"] = jade_interp = function(f){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<div" + (jade.cls(['field','compact',f.kind], [null,null,true])) + "><span class=\"name\">" + (jade.escape(null == (jade_interp = f.name) ? "" : jade_interp)) + "</span>:&nbsp;");
switch (f.displayType){
case 'array':
buf.push("<span class=\"openBracket\">[</span><div class=\"array\">");
// iterate f.value
;(function(){
  var $$obj = f.value;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var o = $$obj[$index];

jade_mixins["obj"](o);
buf.push(",");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var o = $$obj[$index];

jade_mixins["obj"](o);
buf.push(",");
    }

  }
}).call(this);

buf.push("</div><span class=\"closeBracket\">]</span>");
  break;
case 'object':
jade_mixins["obj"](f.value);
  break;
default:
buf.push("<span" + (jade.cls(['value',typeof(f.value)], [null,true])) + ">" + (jade.escape(null == (jade_interp = JSON.stringify(f.value, null, 2)) ? "" : jade_interp)) + "</span>");
  break;
}
buf.push("<span>,</span>");
if ( f.description || f.values || f.Format)
{
buf.push("<span class=\"toggle\"></span><ul class=\"details\"><span class=\"comment\">//&nbsp;</span>");
if ( f.description)
{
buf.push("<li><b class=\"descriptionLabel\">description :&nbsp;</b>" + (jade.escape(null == (jade_interp = f.description) ? "" : jade_interp)) + "</li>");
}
if ( f.values)
{
buf.push("<li><b class=\"valuesLabel\">valeurs possibles :&nbsp;");
if ( f.values instanceof Array)
{
buf.push(jade.escape(null == (jade_interp = f.values.map(JSON.stringify).join(', ')) ? "" : jade_interp));
}
else
{
buf.push(jade.escape(null == (jade_interp = JSON.stringify(f.values)) ? "" : jade_interp));
}
buf.push("</b></li>");
}
if ( f.Format)
{
buf.push("<li><b>Format :&nbsp;</b>" + (jade.escape(null == (jade_interp = f.Format) ? "" : jade_interp)) + "</li>");
}
buf.push("</ul>");
}
buf.push("</div>");
};
jade_mixins["obj"](fields);
buf.push(",");}.call(this,"Array" in locals_for_with?locals_for_with.Array:typeof Array!=="undefined"?Array:undefined,"JSON" in locals_for_with?locals_for_with.JSON:typeof JSON!=="undefined"?JSON:undefined,"fields" in locals_for_with?locals_for_with.fields:typeof fields!=="undefined"?fields:undefined));;return buf.join("");
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
;var locals_for_with = (locals || {});(function (description, docType, hasProperty, help, name, subsets, synthSetInDS, synthSetInsertable, typology, undefined, updateFrequency, updateLatency) {
jade_mixins["properties"] = jade_interp = function(props){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<ul class=\"properties\">");
// iterate props
;(function(){
  var $$obj = props;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var prop = $$obj[$index];

buf.push("<li><b>" + (jade.escape(null == (jade_interp = prop.name) ? "" : jade_interp)) + "</b>&ensp;:&ensp;" + (jade.escape(null == (jade_interp = prop.description) ? "" : jade_interp)));
if ( prop.hasProperty)
{
jade_mixins["properties"](prop.allProperties);
}
if ( prop.items)
{
jade_mixins["properties"](prop.items.allProperties);
}
buf.push("</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var prop = $$obj[$index];

buf.push("<li><b>" + (jade.escape(null == (jade_interp = prop.name) ? "" : jade_interp)) + "</b>&ensp;:&ensp;" + (jade.escape(null == (jade_interp = prop.description) ? "" : jade_interp)));
if ( prop.hasProperty)
{
jade_mixins["properties"](prop.allProperties);
}
if ( prop.items)
{
jade_mixins["properties"](prop.items.allProperties);
}
buf.push("</li>");
    }

  }
}).call(this);

buf.push("</ul>");
};
buf.push("<div class=\"title\">");
if ( typology && name)
{
buf.push("<span class=\"typologie\">" + (jade.escape(null == (jade_interp = typology) ? "" : jade_interp)) + "&nbsp;/&nbsp;</span><h2 class=\"subset\">" + (jade.escape(null == (jade_interp = name) ? "" : jade_interp)) + "</h2>");
}
buf.push("");
if ( synthSetInsertable)
{
buf.push("<button type=\"button\" class=\"insert btn btn-primary\"><span class=\"iconicstroke-cloud-upload\"></span>&nbsp;Insérer dans le Cozy</button>");
}
if ( synthSetInDS)
{
buf.push("<button type=\"button\" class=\"delete btn btn-danger\"><span class=\"iconicstroke-trash-stroke\"></span>&nbsp;Supprimer du Cozy</button>");
}
buf.push("</div>");
if ( name)
{
buf.push("<p>" + (jade.escape(null == (jade_interp = description) ? "" : jade_interp)) + "</p>");
if ( help)
{
buf.push("<p><b>Informations pour la ré-utilisation :&ensp;</b>" + (jade.escape(null == (jade_interp = help) ? "" : jade_interp)) + "</p>");
}
buf.push("<ul class=\"caracteristiques\"><li><b>Fréquence :&nbsp;</b>" + (jade.escape(null == (jade_interp = updateFrequency) ? "" : jade_interp)) + "</li><li><b>Latence :&nbsp;</b>" + (jade.escape(null == (jade_interp = updateLatency) ? "" : jade_interp)) + "</li><li><b>Propriétés :&nbsp;</b>");
jade_mixins["properties"](hasProperty);
buf.push("</li></ul>");
}
buf.push("<div class=\"well\">DocType :&nbsp;<b>" + (jade.escape(null == (jade_interp = docType.name) ? "" : jade_interp)) + "</b><p>" + (jade.escape(null == (jade_interp = docType.description) ? "" : jade_interp)) + "</p><div class=\"similaires\">Du même doctype :<ul>");
// iterate subsets
;(function(){
  var $$obj = subsets;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var s = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = s.name) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var s = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = s.name) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ul></div></div>");}.call(this,"description" in locals_for_with?locals_for_with.description:typeof description!=="undefined"?description:undefined,"docType" in locals_for_with?locals_for_with.docType:typeof docType!=="undefined"?docType:undefined,"hasProperty" in locals_for_with?locals_for_with.hasProperty:typeof hasProperty!=="undefined"?hasProperty:undefined,"help" in locals_for_with?locals_for_with.help:typeof help!=="undefined"?help:undefined,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined,"subsets" in locals_for_with?locals_for_with.subsets:typeof subsets!=="undefined"?subsets:undefined,"synthSetInDS" in locals_for_with?locals_for_with.synthSetInDS:typeof synthSetInDS!=="undefined"?synthSetInDS:undefined,"synthSetInsertable" in locals_for_with?locals_for_with.synthSetInsertable:typeof synthSetInsertable!=="undefined"?synthSetInsertable:undefined,"typology" in locals_for_with?locals_for_with.typology:typeof typology!=="undefined"?typology:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined,"updateFrequency" in locals_for_with?locals_for_with.updateFrequency:typeof updateFrequency!=="undefined"?updateFrequency:undefined,"updateLatency" in locals_for_with?locals_for_with.updateLatency:typeof updateLatency!=="undefined"?updateLatency:undefined));;return buf.join("");
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

;require.register("views/templates/formrequest.jade", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<h3>Requêtes au datasystem</h3><div class=\"defineview\"><div class=\"method\">cozy.client.data.<b>defineIndex</b>(</div><ul><li><input id=\"inputdoctype\" type=\"text\" placeholder=\"DocType\" name=\"doctype\" value=\"Event\" class=\"param\"/><span>,</span></li><li><span>[</span><input id=\"inputfields\" type=\"text\" placeholder=\"MyRequest['field1', 'field2', ...]\" name=\"name\" value=\"'_id'\" class=\"param\"/><span>])</span></li></ul></div><div class=\"queryview\"><div class=\"method\">.then(function(index) { return&nbsp;cozy.client.data.<b>query</b>(</div><ul><li><span>index,</span></li><li><textarea id=\"queryparams\" placeholder=\"\" rows=\"5\">{\n  \"selector\": { \"_id\": { \"$gt\": null }},\n  limit: 10,\n}</textarea><span>); });</span></li></ul></div><button id=\"inputsend\" class=\"btn btn-success\">Envoyer →</button>");;return buf.join("");
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
;var locals_for_with = (locals || {});(function (name, sourceDataController) {
buf.push("<span class=\"imgcontainer\"><img" + (jade.attr("src", 'img/holders/logo_' + sourceDataController.toLowerCase() + '.png', true, false)) + (jade.attr("title", sourceDataController, true, false)) + "/></span><span class=\"name\">" + (jade.escape(null == (jade_interp = name) ? "" : jade_interp)) + "</span>");}.call(this,"name" in locals_for_with?locals_for_with.name:typeof name!=="undefined"?name:undefined,"sourceDataController" in locals_for_with?locals_for_with.sourceDataController:typeof sourceDataController!=="undefined"?sourceDataController:undefined));;return buf.join("");
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

buf.push("<div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\"#thenavbar\" aria-expanded=\"false\" class=\"navbar-toggle collapsed\"><span class=\"sr-only\">Toggle navigation</span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><img src=\"img/logo_mesinfos.png\" class=\"navbar-brand\"/></div><div id=\"thenavbar\" class=\"collapse navbar-collapse\"><ul class=\"typologies nav navbar-nav\"></ul></div>");;return buf.join("");
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

  groupBy: 'typology',
  comparator: 'name',

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

