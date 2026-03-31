// profileRoutes.js — mount with: app.use('/api/profile', profileRouter)

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');

// ── Adjust this path to wherever your User model lives ──
const User = require('../model/model.js');

// ══════════════════════════════════════════════
//  AUTH MIDDLEWARE
//  ✅ Uses your existing verifyToken middleware.
//  Check what your router.js exports its middleware
//  as and import it here. Common names below —
//  uncomment whichever matches yours:
//
//  const { verifyToken } = require('./router');
//  const verifyToken = require('../middleware/verifyToken');
//  const { protect } = require('../middleware/auth');
//
//  Then replace every `protect` below with that name.
//
//  If you don't have a separate middleware file,
//  the inline version below reads the same cookie
//  and JWT your existing auth routes use.
// ══════════════════════════════════════════════
const protect = async (req, res, next) => {
    try {
        const jwt = require('jsonwebtoken');

        // ✅ Tries both common cookie names — 'token' and 'jwt'
        const token = req.cookies?.token || req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Tries every common field name used when signing the JWT
        req.userId = decoded.userId
                  || decoded.id
                  || decoded._id
                  || decoded.sub
                  || decoded.user?.id
                  || decoded.user?._id;

        if (!req.userId) {
            return res.status(401).json({ success: false, message: 'Invalid token payload' });
        }

        next();
    } catch (err) {
        console.error('❌ Auth middleware error:', err.message);
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
};


// ══════════════════════════════════════════════
//  GET /api/profile  →  get logged-in user's profile
// ══════════════════════════════════════════════
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, user });
    } catch (err) {
        console.error('❌ Get profile error:', err.message);
        res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  PUT /api/profile/update  →  update profile fields
// ══════════════════════════════════════════════
router.put('/update', protect, async (req, res) => {
    const { username, email, displayName, bio, country, dob } = req.body;

    console.log('✏️  Profile update request for userId:', req.userId);

    try {
        // Check if username is taken by another user
        if (username) {
            const taken = await User.findOne({ username, _id: { $ne: req.userId } });
            if (taken) {
                return res.status(409).json({ message: 'Username is already taken.' });
            }
        }

        // Check if email is taken by another user
        if (email) {
            const taken = await User.findOne({ email, _id: { $ne: req.userId } });
            if (taken) {
                return res.status(409).json({ message: 'Email is already in use.' });
            }
        }

        const updated = await User.findByIdAndUpdate(
            req.userId,
            {
                $set: {
                    ...(username    && { username }),
                    ...(email       && { email }),
                    ...(displayName !== undefined && { displayName }),
                    ...(bio         !== undefined && { bio }),
                    ...(country     !== undefined && { country }),
                    ...(dob         !== undefined && { dob }),
                    updatedAt: new Date(),
                }
            },
            { new: true }
        ).select('-password');

        console.log('✅ Profile updated:', updated.username);
        res.json({ success: true, user: updated });

    } catch (err) {
        console.error('❌ Profile update error:', err.message);
        res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  PUT /api/profile/change-password  →  change password
// ══════════════════════════════════════════════
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Both current and new password are required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        // Hash new password
        const salt        = await bcrypt.genSalt(10);
        user.password     = await bcrypt.hash(newPassword, salt);
        user.updatedAt    = new Date();
        await user.save();

        console.log('✅ Password changed for userId:', req.userId);
        res.json({ success: true, message: 'Password changed successfully.' });

    } catch (err) {
        console.error('❌ Change password error:', err.message);
        res.status(500).json({ message: 'Failed to change password', error: err.message });
    }
});


// ══════════════════════════════════════════════
//  DELETE /api/profile/delete  →  delete account
// ══════════════════════════════════════════════
router.delete('/delete', protect, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.userId);

        // Clear auth cookie
        res.clearCookie('token');

        console.log('✅ Account deleted for userId:', req.userId);
        res.json({ success: true, message: 'Account deleted.' });

    } catch (err) {
        console.error('❌ Delete account error:', err.message);
        res.status(500).json({ message: 'Failed to delete account', error: err.message });
    }
});


module.exports = router;
