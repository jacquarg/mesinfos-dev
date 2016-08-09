module.exports = {
  // See http://brunch.io for documentation.
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^vendor/,
        'app.js': /^app/
      },
      order: {
        before: [
          'vendor/marionette/lodash.js',
          'vendor/marionette/jquery.js',
          'vendor/marionette/backbone.js',
          'vendor/marionette/backbone.babysitter.js',
          'vendor/marionette/backbone.radio.js',
          'vendor/marionette/backbone.marionette.js',
          'vendor/marionette/radio.shim.js',
          'vendor/moment.min.js',
          'vendor/moment_locale-fr.js',
          ]
      }
    },
    stylesheets: {joinTo: 'app.css'},
    templates: {
      joinTo: 'app.js'
    },
  },
  plugins: {
    jade: {
      globals: ['moment', '_']
    },
  }
}
