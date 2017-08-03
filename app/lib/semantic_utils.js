'use-strict'
const M = {}

M.getItem = (item, allItems) => {
  if (typeof item === 'string') { // it's an id !
    return allItems[item]
  }
  return allItems[item['@id']]
}

M.idList2ItemMap = (ids, allItems) => {
  return ids.reduce((agg, id) => {
    agg[id] = allItems[id]
    return agg
  }, {})
}

M.mapByProp = (prop, items, allItems) => {
  return items.reduce((agg, id) => {
    const item = M.getItem(id, allItems)
    agg[item[prop]] = item
    return agg
  }, {})
}

module.exports = M
