'use-strict'

const semutils = require('../lib/semantic_utils')
const template = require('views/templates/document')

module.exports = Mn.ItemView.extend({
  tagName: 'li',
  template: template,
  className: 'doctype',

  events: {
    'click .toggle': 'toggleDetails',
  },

  toggleDetails: function (ev) {
    const fieldElem = $(ev.currentTarget).parent()
    fieldElem.toggleClass('compact')
    fieldElem.toggleClass('expanded')
  },

});
