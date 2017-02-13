import handlebars from 'handlebars';

handlebars.registerHelper('stringify', function (value, operator, rvalue, options) {
  return JSON.stringify(value);
});
