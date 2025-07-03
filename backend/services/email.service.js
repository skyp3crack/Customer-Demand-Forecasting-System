const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const logger = require('../utils/logger');
const fs = require('fs');

class EmailService {
  constructor() {
    logger.info('Initializing email service with config:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.auth?.user ? '***' : 'NOT SET'
    });
    
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth?.user,
        pass: emailConfig.auth?.pass,
      },
      tls: emailConfig.tls,
      debug: true,
      logger: true
    });
  }

  async sendReportEmail({ to, reportUrl, reportTitle, message = '', fromUser, attachments = [] }) {
    let tempFiles = [];
    
    try {
      logger.info('Preparing to send email:', { 
        to, 
        reportTitle,
        attachmentsCount: attachments.length 
      });

      // Process attachments for email
      const emailAttachments = attachments.map(attachment => ({
        filename: attachment.filename,
        path: attachment.path,
        cid: attachment.cid
      }));

      const mailOptions = {
        from: `"Pharma Forecast" <${emailConfig.auth.user}>`,
        to,
        subject: `Report Shared: ${reportTitle}`,
        html: this.getEmailTemplate({ 
          reportUrl, 
          reportTitle, 
          message, 
          fromUser,
          hasAttachments: attachments.length > 0,
          attachments: attachments.map(a => a.filename)
        }),
        text: `You've received a shared report from Pharma Forecast.\n\n` +
              `Title: ${reportTitle}\n` +
              (message ? `Message: ${message}\n\n` : '\n') +
              (attachments.length > 0 ? 
                `Attachments: ${attachments.map(a => a.filename).join(', ')}\n\n` : '') +
              `View the report: ${reportUrl}`,
        attachments: emailAttachments
      };

      logger.debug('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        attachments: mailOptions.attachments.length
      });

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent:', info.messageId);
      
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    } finally {
      // Clean up temporary files
      await this.cleanupTempFiles(tempFiles);
    }
  }

  getEmailTemplate({ reportUrl, reportTitle, message, fromUser, hasAttachments = false, attachments = [] }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin: 15px 0;
          }
          .footer { 
            margin-top: 20px; 
            padding: 10px; 
            text-align: center; 
            font-size: 0.8em; 
            color: #777;
          }
          .attachments {
            margin: 15px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border-left: 4px solid #4CAF50;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Report Shared: ${reportTitle}</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>${fromUser} has shared a report with you on Pharma Forecast.</p>
            
            ${message ? `<blockquote>${message}</blockquote>` : ''}
            
            <a href="${reportUrl}" class="button">View Report</a>
            
            ${hasAttachments ? `
              <div class="attachments">
                <h3>Attachments (${attachments.length}):</h3>
                <ul>
                  ${attachments.map(file => `<li>${file}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser :) :</p>
            <p><a href="${reportUrl}">${reportUrl}</a></p>
            
            <p>Best regards,<br>The Pharma Forecast Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async cleanupTempFiles(files) {
    const deletePromises = files.map(filePath => {
      return new Promise((resolve) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting temp file ${filePath}:`, err);
          } else {
            logger.debug(`Deleted temp file: ${filePath}`);
          }
          resolve();
        });
      });
    });
    
    await Promise.all(deletePromises);
  }
}

module.exports = new EmailService();
