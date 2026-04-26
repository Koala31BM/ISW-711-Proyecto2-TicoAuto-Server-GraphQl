const jwt = require('jsonwebtoken');

const getAuthUser = (req) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const requireAuth = (user) => {
  if (!user) {
    const error = new Error('No autenticado. Proporcione un token Bearer válido.');
    error.extensions = { code: 'UNAUTHENTICATED' };
    throw error;
  }
};

module.exports = { getAuthUser, requireAuth };