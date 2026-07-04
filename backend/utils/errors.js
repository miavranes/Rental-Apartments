// Centralized handling for unexpected (500) errors.
// Logs the full error server-side but never leaks internals (stack traces,
// DB error messages, etc.) to the client in production.
const serverError = (res, err, publicMessage = 'Something went wrong. Please try again.') => {
  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: isDev ? err.message : publicMessage });
};

module.exports = { serverError };
