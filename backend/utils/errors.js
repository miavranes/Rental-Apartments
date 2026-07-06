const serverError = (res, err, publicMessage = 'Something went wrong. Please try again.') => {
  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: isDev ? err.message : publicMessage });
};

module.exports = { serverError };
