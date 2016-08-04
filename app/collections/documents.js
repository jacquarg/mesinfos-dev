var app = undefined;

module.exports = Backbone.Collection.extend({


  initialize: function() {
    app = require('application');
    this.listenTo(app, 'documents:fetch', this.fetchDSView);
  },

  fetchDSView: function(dsView) {
    console.log(arguments);
    this.setDSView(dsView);
    this.fetch({ reset: true });
  },

  setDSView: function(dsView) {
    this.dsView = dsView;
  },

  // Generate fields, with teh metadata !
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
    console.log(doc);
    return doc;
  },

  // override sync

  sync: function(method, collection, options) {
    var onError = options.error;
    if (method !== 'read') {
      console.error('Only read is available on this collection.');
      if (options.error) {
        options.error('Only read is available on this collection.');
      }

      return;
    }

    cozysdk.run(this.dsView.getDocType(), this.dsView.getName(),
      { include_docs: true, limit: 10 },
      function(err, results) {
        if (err) {
          if (options.error) { options.error(err); }
          return;
        }

        options.success(results);
      });
  },

});
