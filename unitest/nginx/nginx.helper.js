import handlebars from 'handlebars'

handlebars.registerHelper('stringify', (value) => JSON.stringify(value))
