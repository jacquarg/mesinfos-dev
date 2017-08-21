'use-strict'

// prototype for metaobject deserialized from json-ld read-only data.
module.exports = class MetaObject {
  constructor(attrs) {
    $.extend(this, attrs)
  }

  get allProperties () {
    let props = []
    if (this.hasProperty) {
      PLD.mapOnObject(this.hasProperty, (prop) => props.push(prop))
    }

    if (this.hasOptionalProperty) {
      PLD.mapOnObject(this.hasOptionalProperty, (prop) => props.push(prop))
    }
    return props
  }
}
