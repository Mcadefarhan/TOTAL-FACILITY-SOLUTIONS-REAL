const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect, requireVerified } = require('../middleware/auth');

const router = express.Router();

// ─── Cloudinary Config ────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer Memory Storage ────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

// ─── POST /api/upload/avatar ──────────────────────────────────────
router.post('/avatar', protect, requireVerified, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Delete old avatar if exists
    if (req.user.avatarPublicId) {
      try { await cloudinary.uploader.destroy(req.user.avatarPublicId); } catch (e) {}
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tfs/avatars',
          public_id: `user_${req.user._id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    req.user.avatar = result.secure_url;
    req.user.avatarPublicId = result.public_id;
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile photo updated.',
      avatar: result.secure_url,
    });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/upload/avatar ────────────────────────────────────
router.delete('/avatar', protect, requireVerified, async (req, res, next) => {
  try {
    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId);
    }
    req.user.avatar = null;
    req.user.avatarPublicId = null;
    await req.user.save();
    res.json({ success: true, message: 'Profile photo removed.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
