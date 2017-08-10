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
