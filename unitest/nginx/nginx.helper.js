import handlebars from 'handlebars'

handlebars.registerHelper('stringify', function (value) {
  return JSON.stringify(value)
})
