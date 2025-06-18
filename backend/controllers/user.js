const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helper = require('../helper');
const { encoderBase64, removeTrailingSymbolFromUrl } = require('../helper');
const m = require('../models');
const svc = require('../services');

async function index(req, res) {
  const {
    where, page, perpage, Sequelize, offset, order,
  } = helper.queryParameters({ req, search_columns: ['name', 'email'] });

  const { verified } = req.query;

  if (verified === '1') {
    where.verifiedAt = { [Sequelize.Op.ne]: null };
  } else if (verified === '0') {
    where.verifiedAt = null;
  }

  try {
    const data = await m.User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: perpage,
      offset,
      ...order,
    });
    res.json({
      data: data.rows, page, perpage, total: data.count,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
}

function getDetails(req, res) {
  const id = (req.query.id) ? req.query.id : req.user.id;
  if (req.user.RoleId === 1 || req.user.id === parseInt(id, 10)) {
    m.User.findOne({
      attributes: { exclude: ['password', 'updatedAt', 'reset_token'] },
      where: { id },
      include: [{ model: m.Role, attributes: ['id', 'name'] }, { model: m.Organization, attributes: ['id', 'name'] }],
    })
      .then((data) => res.json({ data }))
      .catch((e) => res.status(500).send({ error: e }));
  } else {
    res.status(403).send({ error: 'access denied' });
  }
}

function passwordForgot(req, res) {
  m.User.findOne({ where: { email: req.body.email } })
    .then(async (user) => {
      if (!user) {
        res.status(404).send({ data: 'user not found' });
        return;
      }

      const today_crypt = encoderBase64(moment().unix() + 86400000);
      const content = {
        uid: encoderBase64(user.id),
        token: today_crypt,
      };

      const token = jwt.sign(content, process.env.PROJECT_JWT_SECRET);
      await user.update({ reset_token: token });
      const url = `${removeTrailingSymbolFromUrl(req.body.redirect_url)}?token=${token}`;

      svc.sendMailForgotPassword(url, user);
      res.send({ data: 'successfuly request for password reset' });
    })
    .catch((e) => res.status(500).send({ error: e }));
}

function verifyUser(req, res) {
  m.User.findOne({ where: { id: req.body.id } })
    .then((user) => {
      if (!user) {
        res.status(404).send({ data: 'user not found' });
        return;
      }
      user.update({ verifiedAt: moment().format('YYYY-MM-DD HH:mm:ss') });
      res.json({ status: 'approved' });
    })
    .catch((e) => res.status(500).send({ error: e }));
}

// Get current user's profile
async function getProfile(req, res) {
  console.info('User ID from token:', req.user.id);
  console.debug('User object from token:', req.user);
  try {
    const user = await m.User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'reset_token'] },
      include: [
        { 
          model: m.Role,
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;
    
    const user = await m.User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle file upload if present
    if (req.file) {
      // If there's an old image, you might want to delete it
      // fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'profile-images', user.image));
      
      // Update image path (or URL if using cloud storage)
      user.image = `/uploads/profile-images/${req.file.filename}`;
    }

    // Update other fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Return updated user data (excluding sensitive fields)
    const userData = user.get({ plain: true });
    delete userData.password;
    delete userData.reset_token;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Change user password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Find user by ID
    const user = await m.User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save updated user
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getDetails,
  passwordForgot,
  verifyUser,
  index,
  getProfile,
  updateProfile,
  changePassword
};
