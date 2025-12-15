const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { emailTemplates, sendEmail } = require('../services/emailService');

// Team Management
const createTeam = async (req, res) => {
  try {
    const { teamId, teamName, paymentId, regId } = req.body;
    const createdBy = req.user.id;

    if (!teamId || !teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and team name are required',
      });
    }

    // Check if team ID already exists
    const existingTeam = await prisma.team.findUnique({
      where: { teamId },
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team ID already exists',
      });
    }

    const team = await prisma.team.create({
      data: {
        teamId,
        teamName,
        paymentId,
        regId,
        createdBy,
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTeams = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { teamName: { contains: search, mode: 'insensitive' } },
        { teamId: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: { name: true, email: true }
          },
          _count: {
            select: { members: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.team.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            accessGranted: true,
            lastLogin: true,
            createdAt: true,
            _count: {
              select: { documents: true }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, paymentId, regId } = req.body;

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(teamName && { teamName }),
        ...(paymentId !== undefined && { paymentId }),
        ...(regId !== undefined && { regId }),
      },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if team has members
    const memberCount = await prisma.teamMember.count({
      where: { teamId: id }
    });

    if (memberCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team with existing members',
      });
    }

    await prisma.team.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Team Member Management
const createTeamMember = async (req, res) => {
  try {
    const { teamId, name, email, role = 'MEMBER' } = req.body;

    if (!teamId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Team ID, name, and email are required',
      });
    }

    // Check if email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        name,
        email,
        password: hashedPassword,
        role,
      },
      include: {
        team: {
          select: { teamName: true, teamId: true }
        }
      }
    });

    // Send welcome email
    try {
      const emailContent = emailTemplates.welcomeTeamMember(
        name,
        team.teamName,
        email,
        tempPassword
      );
      await sendEmail(email, emailContent.subject, emailContent.html);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: {
        ...member,
        tempPassword, // Include in response for admin reference
      },
    });
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, teamId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(teamId && { teamId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      })
    };

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          team: {
            select: { teamName: true, teamId: true }
          },
          _count: {
            select: { documents: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.teamMember.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, status, accessGranted } = req.body;

    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(accessGranted !== undefined && { accessGranted }),
      },
      include: {
        team: {
          select: { teamName: true, teamId: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: member,
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teamMember.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const resetMemberPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          select: { teamName: true }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.teamMember.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Send password reset email
    try {
      const emailContent = emailTemplates.welcomeTeamMember(
        member.name,
        member.team.teamName,
        member.email,
        tempPassword
      );
      await sendEmail(member.email, 'Password Reset - IWC', emailContent.html);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: { tempPassword },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  resetMemberPassword,
};
