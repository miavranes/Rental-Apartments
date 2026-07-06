const Joi = require('joi');

const createApartment = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().max(5000).allow('', null),
  location: Joi.string().trim().min(2).max(255).required(),
  municipality: Joi.string().trim().max(255).allow('', null),
  country: Joi.string().trim().max(255).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  max_guests: Joi.number().integer().min(1).max(50).required(),
  bedrooms: Joi.number().integer().min(0).max(50).required(),
  beds: Joi.number().integer().min(0).max(50).required(),
  price_per_night: Joi.number().min(0).max(1000000).required(),
  amenities: Joi.string().allow('', null), // JSON-encoded array, parsed in controller
  lat: Joi.number().min(-90).max(90).allow(null, ''),
  lng: Joi.number().min(-180).max(180).allow(null, ''),
  payment_method: Joi.string().valid('on_arrival', 'online').default('on_arrival'),
});

const updateApartment = createApartment;

module.exports = { createApartment, updateApartment };
