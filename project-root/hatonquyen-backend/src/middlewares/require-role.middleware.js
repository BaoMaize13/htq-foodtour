const normalizeRoleCode = (value) => String(value || '').trim().toUpperCase();

const requireRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.flat().map(normalizeRoleCode).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const currentRoleCode = normalizeRoleCode(req.user.roleCode || req.user.role?.code);

    if (!currentRoleCode || !normalizedAllowedRoles.includes(currentRoleCode)) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    return next();
  };
};

module.exports = requireRole;
