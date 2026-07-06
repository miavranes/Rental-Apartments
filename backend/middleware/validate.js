const validate = (schema, { source = 'body' } = {}) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,   // collect all errors, not just the first
    stripUnknown: true,  // drop fields that aren't in the schema
  });

  if (error) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: error.details.map((d) => d.message),
    });
  }

  req[source] = value;
  next();
};

module.exports = validate;
