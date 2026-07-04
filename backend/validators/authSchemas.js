const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('tourist', 'owner').default('tourist'),
  phone: Joi.string().trim().max(50).allow('', null),
});

const login = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const verifyEmail = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(72).required(),
});

const updateProfile = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().max(50).allow('', null),
});

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, updateProfile };
