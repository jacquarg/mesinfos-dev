'use-strict'

const PLD = {}

// items, mapped by id
PLD.allItems = {}

PLD.mapClassOnType = {}

PLD.getItem = (item) => {
  let attrs = {}
  if (typeof item === 'string') { // it's an id !
    attrs = PLD.allItems[item]
  } else {
    attrs = PLD.allItems[item['@id']]
  }

  let type = attrs['@type']
  if (type instanceof Array) {
    for (type of attrs['@type']) {
      if (PLD.mapClassOnType[type]) break
    }
  }

  if (PLD.mapClassOnType[type]) { return new PLD.mapClassOnType[type](attrs) }

  return attrs
}

PLD.isType = (item, type) => {
  if (!(item && item['@type'])) { return false }

  const typeProp = item['@type']
  return  typeProp === type || (typeProp instanceof Array && typeProp.indexOf(type) !== -1)
}

PLD.mapOnObject = (objects, fun) => {
  if (objects instanceof Array) {
    return objects.map(fun)
  }
  return fun(objects)
}

PLD.testOnObject = (objects, test) => {
  if (objects && objects instanceof Array) {
    return objects.some(test);
  } else {
    return test(objects);
  }

}

PLD.forEachOnTreeOfPredicates = (fun , item, props) => {
  item = PLD.getItem(item)
  fun(item)
  props.forEach((prop) => {
    if (item[prop]) {
      item[prop] = PLD.mapOnObject(item[prop], (value) => PLD.forEachOnTreeOfPredicates(fun, value, props))
    }
  })

  return item
}

PLD.fillTreeForPredicates = (item, props) => {
  PLD.forEachOnTreeOfPredicates(() => undefined, item, props)
  return item
}

PLD.idList2ItemMap = (ids) => {
  return ids.reduce((agg, id) => {
    agg[id] = PLD.allItems[id]
    return agg
  }, {})
}

PLD.mapByPredicate = (prop, items) => {
  return items.reduce((agg, id) => {
    try {
      const item = PLD.getItem(id, PLD.allItems)
      agg[item[prop]] = item
      return agg
    } catch (e) {
      console.error(`semantic_utils : Error in map by prop on id: ${id}`, e)
      throw e
    }
  }, {})
}

typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = PLD :
// typeof define === 'function' && define.aPLDd ? define(factory) :
this.PLD = PLD // put on window.
