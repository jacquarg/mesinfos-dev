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
      delete res.result;
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
