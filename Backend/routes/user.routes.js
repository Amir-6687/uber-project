const express = require('express');
const router = express.Router();
const { body } = require("express-validator");
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('fullname.firstname').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], userController.registerUser);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], userController.loginUser);

router.get('/profile', authMiddleware.authUser, userController.getUserProfile);

router.patch('/profile', authMiddleware.authUser, [
    body('fullname.firstname').optional().isLength({ min: 3 }).withMessage('First name at least 3 characters'),
    body('fullname.lastname').optional(),
    body('email').optional().isEmail().withMessage('Invalid Email')
], userController.updateUserProfile);

router.patch('/password', authMiddleware.authUser, [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password at least 6 characters')
], userController.changePassword);

router.delete('/profile', authMiddleware.authUser, [
    body('password').notEmpty().withMessage('Password required to delete account')
], userController.deleteUser);

router.get('/logout', authMiddleware.authUser, userController.logoutUser);

router.get('/auth/google', userController.googleAuth);
router.get('/auth/google/callback', userController.googleAuthCallback);
router.get('/auth/apple', userController.appleAuth);



module.exports = router;