const Joi = require('joi');

const createReservation = Joi.object({
  apartment_id: Joi.number().integer().positive().required(),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref('check_in')).required(),
  guests: Joi.number().integer().min(1).max(50).required(),
  // Payment method is decided by the host on the listing, not by the guest —
  // if the client still sends it (e.g. an old cached frontend build), we
  // simply ignore it rather than rejecting the request.
  payment_method: Joi.any().strip(),
});

module.exports = { createReservation };
