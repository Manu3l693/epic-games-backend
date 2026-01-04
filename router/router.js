const express = require('express')
const router = express.Router()

const {SignUp, VerifyEmail, Login, VerifyAuth, Logout} = require('../controller/controller.js')

router.post('/signup', SignUp)
router.post('/verify', VerifyEmail)
router.post('/login', Login)
router.get('/verify', VerifyAuth);
router.post('/logout', Logout);

module.exports = router