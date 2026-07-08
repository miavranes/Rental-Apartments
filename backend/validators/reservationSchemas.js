const Joi = require('joi');

const createReservation = Joi.object({
  apartment_id: Joi.number().integer().positive().required(),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref('check_in')).required().messages({
    'date.greater': 'Check-out date must be at least one night after check-in date.',
  }),
  guests: Joi.number().integer().min(1).max(50).required(),
  payment_method: Joi.any().strip(),
});

module.exports = { createReservation };
