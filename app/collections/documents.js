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

  _generateFields: function(doc) {
    'use-strict'

    const docType = app.doctypes[this.dsView.getDocType()]
    let fieldsDocumentation = []
    if (docType.hasOptionalProperty) {
      fieldsDocumentation = fieldsDocumentation.concat(docType.hasOptionalProperty)
    }
    if (docType.hasProperty) {
      fieldsDocumentation = fieldsDocumentation.concat(docType.hasProperty)
    }

    fieldsDocumentation = fieldsDocumentation.map(id => semutils.getItem(id, app.wikiapi))
    console.log(fieldsDocumentation)
    // TODO : get fields from subsets.

    var viewedFields = {};
    var fields = fieldsDocumentation.reduce(function(agg, field) {
      if (!doc[field.name]) { return agg; }

      viewedFields[field.name] = true;
      var f = $.extend({}, field);
      f.value = doc[field.name];
      agg.push(f);
      return agg;
    }, []);

    for (var k in doc) {
      if (!(k in viewedFields)) {
        fields.push({ name: k, value: doc[k] })
      }
    }

    fields.sort(function(a, b) {
      if (a.kind === 'Metadata' && b.kind !== 'Metadata') {
          return 1;
      } else if (a.kind !== 'Metadata' && b.kind === 'Metadata') {
          return -1;
      } else {
          return a.name > b.name ? 1 : -1;
      }
    });
    doc.fields = fields;

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
