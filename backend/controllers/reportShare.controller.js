const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadDir);

// Helper function to clean up files
async function cleanupFiles(filePaths) {
  const deletePromises = filePaths.map(filePath => {
    return fs.remove(filePath)
      .then(() => {
        logger.debug(`Cleaned up file: ${filePath}`);
      })
      .catch(err => {
        logger.error(`Error cleaning up file ${filePath}:`, err);
      });
  });
  
  await Promise.all(deletePromises);
}

class ReportShareController {
  async shareReport(req, res) {
    const fileCleanup = [];
    
    try {
      // Get form data from request body (already parsed by multer)
      const { email, message = '', reportTitle } = req.body;
      const { user } = req;
      
      // Validate required fields (should be already validated by middleware, but double-check)
      if (!email || !reportTitle) {
        return res.status(400).json({
          success: false,
          message: 'Email and report title are required',
        });
      }

      // Handle file uploads
      const attachments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileExt = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExt}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Move file from temp location to uploads directory
          await fs.move(file.path, filePath, { overwrite: true });
          fileCleanup.push(filePath);
          
          attachments.push({
            filename: file.originalname,
            path: filePath,
            cid: uuidv4() // For embedding images in HTML
          });
        }
      }

      // Generate report URL (adjust based on your frontend URL structure)
      const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/reports?shared=true`;
      
      // Send email with attachments
      await emailService.sendReportEmail({
        to: email,
        reportUrl,
        reportTitle,
        message,
        fromUser: user ? user.email : 'a colleague',
        attachments
      });

      logger.info(`Report shared with ${email} by user ${user?.id}`, {
        attachmentsCount: attachments.length
      });
      
      // Clean up files after successful email send
      await cleanupFiles(fileCleanup);
      
      return res.status(200).json({
        success: true,
        message: 'Report shared successfully',
        attachments: attachments.map(a => a.filename)
      });
    } catch (error) {
      logger.error('Error sharing report:', error);
      
      // Clean up any uploaded files on error
      if (fileCleanup.length > 0) {
        await cleanupFiles(fileCleanup).catch(cleanupErr => {
          logger.error('Error during file cleanup:', cleanupErr);
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to share report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ReportShareController();
