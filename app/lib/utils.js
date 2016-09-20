module.exports = {
  slugify: function(stringNonNull) {
    return stringNonNull.toLowerCase().replace(/[^\w-]+/g,'');
  },

  test2MapFunction: function(test) {
    return "function(doc) {\n  " + test + "\n}";
  },


  appNameNVersion: function() {
    // TODO !
    // var pkg = require('package.json');
    //return pkg.name + '-' + pkg.version;
    return 'mesinfosdataplayground' + '-' + '0.0.4-dev';
  },

  generateDisplayError: function(message)  {
    return function(err) {
      console.error(err);
      require('application').trigger('message:error', message);
    };
  },

};
