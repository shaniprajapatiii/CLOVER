const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gigshield_secret');
    const worker = await Worker.findById(decoded.id).select('-password');

    if (!worker) {
      return res.status(401).json({ success: false, message: 'Worker not found.' });
    }

    if (!worker.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }

    req.worker = worker;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.worker && req.worker.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin access required.' });
};

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gigshield_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
