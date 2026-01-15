export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Resource not found',
      message: err.message
    });
  }

  if (err.response?.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please re-authenticate with Google'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}
