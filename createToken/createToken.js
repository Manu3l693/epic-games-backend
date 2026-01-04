const jsonwebtoken = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const generateCookieToken = (res, userId) => {
    const token = jsonwebtoken.sign({userId}, JWT_SECRET_KEY, {
        expiresIn: '7d'
    })

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    })

    return token
}

module.exports = generateCookieToken