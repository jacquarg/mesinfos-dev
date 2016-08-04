module.exports = {
  slugify: function(stringNonNull) {
    return stringNonNull.toLowerCase().replace(/[^\w-]+/g,'');
  },

  test2MapFunction: function(test) {
    return "function(doc) {\n  " + test + "\n}";
  },
}
