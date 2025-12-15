const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const prisma = require('../config/database');

const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and user type are required',
      });
    }

    let user;
    let tokenPayload;

    if (userType === 'admin') {
      user = await prisma.admin.findUnique({
        where: { email },
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'admin',
      };
    } else if (userType === 'team_member') {
      user = await prisma.teamMember.findUnique({
        where: { email },
        include: {
          team: {
            select: { teamName: true, teamId: true }
          }
        }
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      if (user.status !== 'ACTIVE' || !user.accessGranted) {
        return res.status(403).json({
          success: false,
          message: 'Account access denied. Please contact administrator.',
        });
      }

      // Update last login
      await prisma.teamMember.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        type: 'team_member',
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
      });
    }

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: userType,
          ...(userType === 'team_member' && {
            team: user.team,
          }),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const logout = async (req, res) => {
  // Since we're using stateless JWT, logout is handled on the client side
  res.json({
    success: true,
    message: 'Logout successful',
  });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userType = req.user.type;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    let user;
    if (userType === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: userId },
      });
    } else {
      user = await prisma.teamMember.findUnique({
        where: { id: userId },
      });
    }

    if (!user || !await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    if (userType === 'admin') {
      await prisma.admin.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
    } else {
      await prisma.teamMember.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  login,
  logout,
  changePassword,
};
