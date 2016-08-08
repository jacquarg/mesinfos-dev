var Filtered = BackboneProjections.Filtered;
var Sorted = BackboneProjections.Sorted;

module.exports = function(collection, options) {
  var groups = collection.groupBy(options.groupBy);
  var projections = {};
  for (var key in groups) {
    projections[key] = new Filtered(collection, {
      filter: function(item) {
        return groups[key].indexOf(item) !== -1;
      }
    });

    if (options.comparator) {
      projections[key] = new Sorted(projections[key], { comparator: options.comparator });
    }
  }

  return projections;
};
