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
    const metaPropByName = PLD.mapByPredicate('propName', metaProps)

    return Object.keys(obj).map((prop) => {
      const metaProp = metaPropByName[prop]
      let field = { name: prop, value: obj[prop] }
      if (metaProp) {
        field = $.extend(field, metaProp)
      }

      if (PLD.isType(metaProp, 'object')) {
        field.displayType = 'object'
        field.value = this._generateFieldsOfObject(obj[prop], metaProp)
      } else if (PLD.isType(metaProp, 'array')) {
        field.displayType = 'array'
        // TODO : metaProps.items may be a array (in the future)
        field.value = obj[prop].map((propItem) => this._generateFieldsOfObject(propItem, PLD.getItem(metaProp.items)))
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
