const prisma = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary, generateDocumentPath } = require('../services/fileUpload');
const { emailTemplates, sendEmail } = require('../services/emailService');
const archiver = require('archiver');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

// Team Member Document Operations
const uploadDocument = async (req, res) => {
  try {
    const { docType } = req.body;
    const memberId = req.user.id;
    const file = req.file;

    if (!docType || !file) {
      return res.status(400).json({
        success: false,
        message: 'Document type and file are required',
      });
    }

    // Get member info with team
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        team: {
          select: { teamId: true, teamName: true }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // Check if document already exists for this type
    const existingDoc = await prisma.document.findFirst({
      where: {
        memberId,
        docType,
      }
    });

    // Upload to Cloudinary
    const folderPath = generateDocumentPath(member.team.teamId, memberId, docType);
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder: folderPath,
      public_id: `${docType}_${Date.now()}`,
    });

    // If updating existing document, delete old file
    if (existingDoc) {
      try {
        const oldPublicId = existingDoc.fileUrl.split('/').pop().split('.')[0];
        await deleteFromCloudinary(`${folderPath}/${oldPublicId}`);
      } catch (deleteError) {
        console.error('Failed to delete old file:', deleteError);
      }
    }

    // Ensure PDFs use a viewable URL (without download flags)
    let fileUrl = uploadResult.secure_url;
    if (file.mimetype === 'application/pdf') {
      // Remove any attachment flags and add inline display flag
      fileUrl = uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment:false/');
    }

    const documentData = {
      memberId,
      docType,
      fileName: file.originalname,
      fileUrl: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'PENDING',
    };

    let document;
    if (existingDoc) {
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          ...documentData,
          adminComment: null,
          verifiedBy: null,
          verifiedAt: null,
        }
      });
    } else {
      document = await prisma.document.create({
        data: documentData
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: memberId,
        type: 'IN_APP',
        title: 'Document Uploaded',
        message: `Your ${docType} document has been uploaded successfully and is pending review.`,
      }
    });

    res.status(201).json({
      success: true,
      message: existingDoc ? 'Document updated successfully' : 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const memberId = req.user.id;

    const documents = await prisma.document.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get my documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTeamProgress = async (req, res) => {
  try {
    const memberId = req.user.id;

    // Get member's team
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { teamId: true }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // Get all team members with their document counts
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: member.teamId },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            documents: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    // Define required document types for Indonesian Visa Application
    const requiredDocTypes = [
      'PASSPORT_ORIGINAL', 
      'PASSPORT_PHOTOS', 
      'BANK_STATEMENT', 
      'BANK_CHEQUE',
      'COVER_LETTER',
      'TICKET_BOOKING',
      'HOTEL_BOOKING',
      'TRAVEL_INSURANCE'
    ];
    const totalRequired = requiredDocTypes.length;

    const progress = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      approvedDocuments: member._count.documents,
      totalRequired,
      progressPercentage: Math.round((member._count.documents / totalRequired) * 100),
    }));

    res.json({
      success: true,
      data: {
        teamProgress: progress,
        requiredDocuments: requiredDocTypes,
      },
    });
  } catch (error) {
    console.error('Get team progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin Document Operations
const getAllDocuments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      teamId, 
      memberId, 
      docType, 
      status,
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(teamId && { member: { teamId } }),
      ...(memberId && { memberId }),
      ...(docType && { docType }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { docType: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
          { member: { name: { contains: search, mode: 'insensitive' } } },
        ]
      })
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              team: {
                select: { teamId: true, teamName: true }
              }
            }
          },
          verifier: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.id;

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminComment: comment,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
      include: {
        member: {
          select: {
            name: true,
            email: true,
            team: {
              select: { teamName: true }
            }
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: document.memberId,
        type: 'IN_APP',
        title: 'Document Approved',
        message: `Your ${document.docType} document has been approved.`,
      }
    });

    // Send email notification
    try {
      const emailContent = emailTemplates.documentApproved(
        document.member.name,
        document.docType,
        document.member.team.teamName
      );
      await sendEmail(document.member.email, emailContent.subject, emailContent.html);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Document approved successfully',
      data: document,
    });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.id;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required for rejection',
      });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminComment: comment,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
      include: {
        member: {
          select: {
            name: true,
            email: true,
            team: {
              select: { teamName: true }
            }
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: document.memberId,
        type: 'IN_APP',
        title: 'Document Rejected',
        message: `Your ${document.docType} document has been rejected. Please check the comments and resubmit.`,
      }
    });

    // Send email notification
    try {
      const emailContent = emailTemplates.documentRejected(
        document.member.name,
        document.docType,
        document.member.team.teamName,
        comment
      );
      await sendEmail(document.member.email, emailContent.subject, emailContent.html);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'Document rejected successfully',
      data: document,
    });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getDocumentStats = async (req, res) => {
  try {
    const stats = await prisma.document.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const totalDocuments = await prisma.document.count();
    const totalTeams = await prisma.team.count();
    const totalMembers = await prisma.teamMember.count();

    const statusStats = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    stats.forEach(stat => {
      statusStats[stat.status] = stat._count.status;
    });

    res.json({
      success: true,
      data: {
        totalDocuments,
        totalTeams,
        totalMembers,
        statusStats,
      },
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getTeamProgress,
  getAllDocuments,
  approveDocument,
  rejectDocument,
  getDocumentStats,
};
