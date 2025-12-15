const prisma = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.teamMember.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            teamId: true,
            teamName: true,
            paymentId: true,
            regId: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const user = await prisma.teamMember.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: {
            teamId: true,
            teamName: true,
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId,
      ...(unreadOnly === 'true' && { isRead: false })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId, // Ensure user can only update their own notifications
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's documents count by status
    const documentStats = await prisma.document.groupBy({
      by: ['status'],
      where: { memberId: userId },
      _count: {
        status: true,
      },
    });

    // Get team progress
    const member = await prisma.teamMember.findUnique({
      where: { id: userId },
      select: { teamId: true }
    });

    const teamStats = await prisma.teamMember.findMany({
      where: { teamId: member.teamId },
      select: {
        _count: {
          select: {
            documents: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    documentStats.forEach(stat => {
      statusCounts[stat.status] = stat._count.status;
    });

    const totalApprovedInTeam = teamStats.reduce((sum, member) => 
      sum + member._count.documents, 0
    );

    // Get recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        documentStats: statusCounts,
        totalDocuments: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        teamApprovedDocuments: totalApprovedInTeam,
        recentNotifications,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getDashboardStats,
};
