const User = require('../model/model.js')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const generateCookieToken = require('../createToken/createToken.js')

dotenv.config()


const SignUp = async (req, res) => {
    try {
        const errors = []

        const {email, firstName, lastName, password, confirmPassword, radio} = req.body

        if(!email || !firstName || !lastName || !password || !confirmPassword || !radio){
            errors.push('All fields are required!')
        }

        const user = await User.findOne({email})

        if(user){
          errors.push('The email address you entered has already been registered!')
        }

        if(confirmPassword !== password){
            errors.push('Passwords do not match')
        }

        if(password.length < 5){
            errors.push('Password must not be lass than 5 characters!')
        }


        if(errors.length > 0){
            return res.json({success: false, error: errors})
        }

        const hashPassword = await bcrypt.hash(password, 10)
        const hashConfirmPassword = await bcrypt.hash(password, 10)

        const verificationToken = Math.floor(Math.random() * 90000) + 10000
        const verificationTokenExpiresAt = Date.now() + 10 * 60 * 1000; 

        const createUser = await User.create({
            firstname: firstName,
            lastname: lastName,
            email: email,
            password: hashPassword,
            confirmPassword: hashConfirmPassword,
            isVerified: false,
            verificationToken: verificationToken,
            verificationTokenExpiresAt: verificationTokenExpiresAt
        })

        await createUser.save()

        return res.json({success: true, message: `Account created successfully, redirecting...`})
        
    } catch (error) {
        res.json({success: false, error: error})
    }
}

const VerifyEmail = async (req, res) => {
    try {
        const { code } = req.body

        const user = await User.findOne({
            verificationToken: code
        })

        if(!user){
            res.json({success: false, error: 'The verification code you entered is incorrect'})
        }

        if(Date.now() > user.verificationTokenExpiresAt){
            res.json({success: false, error: 'The verification token has expire'})
        }

        user.isVerified = true
        user.verificationToken = null
        user.verificationTokenExpiresAt = null
       
        await user.save()

        res.json({success: true, message: 'Verification successful, redirecting...'})

    } catch (error) {
        res.json({success: false, error: error})
    }
}

const Login = async (req, res) => {
    const {email, password} = req.body
    try {

        if(!email || !password){
          return res.json({success: false, error: 'These fields are required!'})
        }

        const user = await User.findOne({email})

        if(!user){
          return res.json({success: false, error: 'The email address you entered have not been registered!'})
        } 

        const verifyPassword = await bcrypt.compare(password, user.password)

        if(!verifyPassword){
            return res.json({success: false, error: 'The password you entered is incorrect!'})
        }

        user.isVerified = true
        user.lastLogin = Date.now()

        await user.save()

        generateCookieToken(res, user._id)
        console.log('Hello world')
        console.log(`userid: ${user._id}`);
        
        res.json({success: true, message: `Log in successful, welcome ${user.firstname}`})

    } catch (error) {
        res.json({success: false, error: error})
    }
}

const VerifyAuth = async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.json({ success: false, error: 'Not authenticated' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.json({ 
        success: false, 
        error: 'Email not verified',
        isVerified: false 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    res.json({ success: false, error: 'Invalid token' });
  }
};

const Logout = async (req, res) => {
  try {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.json({ success: false, error: 'Logout failed' });
  }
};

module.exports = {SignUp, VerifyEmail, Login, VerifyAuth, Logout}