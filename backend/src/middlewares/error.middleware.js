export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }
  
  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON format'
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error'
  });
};