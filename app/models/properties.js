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
    console.log(arguments);
    var callback = function(err, res) {
      if (err) { return options.error(err); }
      options.success(res);
    }

    console.log(this.docType);
    if (method === 'create') {
      return cozysdk.create(this.docType, model.attributes, callback);
    } else if (method === 'update' || method === 'patch') {
      return cozysdk.updateAttributes(this.docType, model.attributes._id, model.attributes, callback);
    } else if (method === 'delete') {
      return cozysdk.destroy(this.docType, model.attributes._id, callback);
    } else if (method === 'read') {
      return cozysdk.find(this.docType, model.attributes._id, callback);
    }
  },

  _promiseSave: function(attributes) {
    return new Promise(function(resolve, reject) {
      this.save(attributes, { success: resolve, error: reject });
    }.bind(this));
  },

  addSynthSetIds: function(setName, ids) {
    console.log(ids);
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
},
{// Class properties

  fetchSingleton: function() {
    var self = this;
    return cozysdk.defineView(Properties.prototype.docType, 'all',
      'function(doc) { emit(doc._id);}'
    ).then(function() {
        return cozysdk.queryView(Properties.prototype.docType, 'all', {limit: 1, include_docs: true}); }
    ).then(function(res) {
      return new Properties((res && res.length !== 0) ? res[0].doc : {});
    });
  },
});


module.exports = Properties.fetchSingleton();
