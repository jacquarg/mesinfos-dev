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
