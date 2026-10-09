// Describe restricciones estructurales; las reglas custom siguen ejecutándose en Joi.
const convert = (description) => {
  const type = description.type;
  const schema = { type: type === 'date' || type === 'any' ? 'string' : type };
  if (type === 'date') schema.format = 'date-time';
  if (description.flags?.description) schema.description = description.flags.description;
  if (description.allow?.includes(null)) schema.nullable = true;
  if (description.flags?.only) {
    const values = description.allow?.filter((value) =>
      ['string', 'number', 'boolean'].includes(typeof value),
    );
    if (values?.length) schema.enum = values;
    if (description.allow?.some((value) => value?.ref))
      schema.description = 'Debe coincidir con el campo referenciado en la validación Joi.';
  }
  if (description.keys) {
    schema.properties = Object.fromEntries(
      Object.entries(description.keys).map(([name, field]) => [name, convert(field)]),
    );
    schema.additionalProperties = false;
    const required = Object.entries(description.keys)
      .filter(([, field]) => field.flags?.presence === 'required')
      .map(([name]) => name);
    if (required.length) schema.required = required;
  }
  if (description.items) schema.items = convert(description.items[0]);
  for (const rule of description.rules || []) {
    if (rule.name === 'integer') schema.type = 'integer';
    if (rule.name === 'email') schema.format = 'email';
    if (rule.name === 'hex') schema.pattern = '^[a-fA-F0-9]+$';
    if (rule.name === 'min' || rule.name === 'max' || rule.name === 'length') {
      const min =
        type === 'object'
          ? 'minProperties'
          : type === 'array'
            ? 'minItems'
            : type === 'string'
              ? 'minLength'
              : 'minimum';
      const max =
        type === 'object'
          ? 'maxProperties'
          : type === 'array'
            ? 'maxItems'
            : type === 'string'
              ? 'maxLength'
              : 'maximum';
      if (rule.name !== 'max') schema[min] = rule.args.limit;
      if (rule.name !== 'min') schema[max] = rule.args.limit;
    }
    if (rule.name === 'sign' && rule.args.sign === 'positive') {
      schema.minimum = 0;
      schema.exclusiveMinimum = true;
    }
    if (rule.name === 'custom') schema['x-joi-custom-validation'] = true;
  }
  return schema;
};
module.exports = (schema) => convert(schema.describe());
