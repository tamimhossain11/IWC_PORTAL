const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  documentApproved: (memberName, docType, teamName) => ({
    subject: `Document Approved - ${docType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Document Approved ✅</h2>
        <p>Dear ${memberName},</p>
        <p>Your document submission has been approved:</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Document Type:</strong> ${docType}</p>
          <p><strong>Team:</strong> ${teamName}</p>
          <p><strong>Status:</strong> <span style="color: #10b981;">Approved</span></p>
        </div>
        <p>Thank you for your submission!</p>
        <p>Best regards,<br>IWC Team</p>
      </div>
    `,
  }),

  documentRejected: (memberName, docType, teamName, reason) => ({
    subject: `Document Rejected - ${docType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Document Rejected ❌</h2>
        <p>Dear ${memberName},</p>
        <p>Your document submission has been rejected and requires resubmission:</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Document Type:</strong> ${docType}</p>
          <p><strong>Team:</strong> ${teamName}</p>
          <p><strong>Status:</strong> <span style="color: #ef4444;">Rejected</span></p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p>Please review the feedback and resubmit your document.</p>
        <p>Best regards,<br>IWC Team</p>
      </div>
    `,
  }),

  welcomeTeamMember: (memberName, teamName, email, tempPassword) => ({
    subject: 'Welcome to IWC - Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to IWC! 🎉</h2>
        <p>Dear ${memberName},</p>
        <p>Your account has been created for the IWC Document Submission System:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Team:</strong> ${teamName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        <p>You can now log in to upload your required documents.</p>
        <p>Best regards,<br>IWC Team</p>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
