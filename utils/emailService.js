const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Validate required environment variables
    if (!process.env.EMAIL_PROVIDER) {
      throw new Error('EMAIL_PROVIDER is required in .env file');
    }
    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER is required in .env file');
    }
    if (!process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_PROVIDER === 'gmail') {
      throw new Error('EMAIL_APP_PASSWORD is required for Gmail in .env file');
    }

    const config = {
      service: process.env.EMAIL_PROVIDER,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    };

    // Handle different email providers
    switch (process.env.EMAIL_PROVIDER) {
      case 'gmail':
        config.service = 'gmail';
        config.auth.pass = process.env.EMAIL_APP_PASSWORD;
        break;
      case 'outlook':
        config.service = 'hotmail';
        config.auth.pass = process.env.EMAIL_PASSWORD;
        break;
      case 'smtp':
        config.host = process.env.SMTP_HOST;
        config.port = process.env.SMTP_PORT || 587;
        config.secure = process.env.SMTP_SECURE === 'true';
        config.auth.user = process.env.SMTP_USER;
        config.auth.pass = process.env.SMTP_PASSWORD;
        delete config.service;
        break;
      default:
        throw new Error('Unsupported email provider');
    }

    console.log('Email config:', {
      service: config.service,
      user: config.auth.user,
      hasPassword: !!config.auth.pass
    });

    return nodemailer.createTransport(config);
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Task assignment email template
  async sendTaskAssignmentEmail(assignedUser, task, assignedBy) {
    const subject = `New Task Assigned: ${task.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME}</h1>
            <h2>New Task Assignment</h2>
          </div>
          <div class="content">
            <p>Hello ${assignedUser.name},</p>
            <p>You have been assigned a new task by <strong>${assignedBy.name}</strong>.</p>
            
            <div class="task-details">
              <h3>Task Details:</h3>
              <p><strong>Title:</strong> ${task.title}</p>
              <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
              <p><strong>Priority:</strong> ${task.priority || 'Medium'}</p>
              <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}</p>
              <p><strong>Status:</strong> ${task.status}</p>
            </div>
            
            <a href="${process.env.CLIENT_URL}/tasks/${task._id}" class="button">View Task Details</a>
            
            <p>Please log in to your account to view more details and update the task status.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${process.env.APP_NAME}</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(assignedUser.email, subject, html);
  }

  // Project creation email template
  async sendProjectCreationEmail(teamMembers, project, createdBy) {
    const subject = `New Project Created: ${project.name}`;
    const memberEmails = teamMembers.map(member => member.email);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .project-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .team-list { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME}</h1>
            <h2>New Project Created</h2>
          </div>
          <div class="content">
            <p>Hello Team,</p>
            <p>A new project has been created by <strong>${createdBy.name}</strong> and you have been added as a team member.</p>
            
            <div class="project-details">
              <h3>Project Details:</h3>
              <p><strong>Name:</strong> ${project.name}</p>
              <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
              <p><strong>Start Date:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}</p>
              <p><strong>End Date:</strong> ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not specified'}</p>
              <p><strong>Status:</strong> ${project.status}</p>
            </div>

            <div class="team-list">
              <h3>Team Members:</h3>
              <ul>
                ${teamMembers.map(member => `<li>${member.name} (${member.email})</li>`).join('')}
              </ul>
            </div>
            
            <a href="${process.env.CLIENT_URL}/projects/${project._id}" class="button">View Project Details</a>
            
            <p>Please log in to your account to view more details and start collaborating on this project.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${process.env.APP_NAME}</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(memberEmails, subject, html);
  }

  // Project member addition email
  async sendProjectMemberAddedEmail(newMember, project, addedBy) {
    const subject = `Added to Project: ${project.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .project-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME}</h1>
            <h2>Added to Project</h2>
          </div>
          <div class="content">
            <p>Hello ${newMember.name},</p>
            <p>You have been added to a project by <strong>${addedBy.name}</strong>.</p>
            
            <div class="project-details">
              <h3>Project Details:</h3>
              <p><strong>Name:</strong> ${project.name}</p>
              <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
              <p><strong>Status:</strong> ${project.status}</p>
            </div>
            
            <a href="${process.env.CLIENT_URL}/projects/${project._id}" class="button">View Project Details</a>
            
            <p>Welcome to the team! Please log in to your account to start collaborating.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${process.env.APP_NAME}</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(newMember.email, subject, html);
  }

  // Utility function to convert HTML to plain text (basic)
  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();