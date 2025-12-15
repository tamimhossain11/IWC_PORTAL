const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check if user exists and is active
    let user;
    if (decoded.type === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });
    } else if (decoded.type === 'team_member') {
      user = await prisma.teamMember.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          status: true, 
          accessGranted: true,
          teamId: true 
        }
      });
      
      if (user && (user.status !== 'ACTIVE' || !user.accessGranted)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account access denied' 
        });
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = { ...user, type: decoded.type };
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.type === 'admin' ? req.user.role : 'TEAM_MEMBER';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const requireSuperAdmin = requireRole('SUPER_ADMIN');
const requireDocumentAdmin = requireRole('SUPER_ADMIN', 'DOCUMENT_ADMIN');
const requireTeamMember = requireRole('TEAM_MEMBER');

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
  requireDocumentAdmin,
  requireTeamMember,
};
