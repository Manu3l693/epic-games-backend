const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const connectDB = require('./connect/connectDB.js')
const router = require('./router/router.js')
const gameRouter1 = require('./router/game.js')


const app = express()
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PUT","DELETE"],
    credentials: true,
    allowedHeaders: ['Content-Type']
}))

app.use(express.json())
app.use(cookieParser())
dotenv.config()

app.use('/api/auth', router)
app.use('/api/games', gameRouter1)

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    connectDB(),
    console.log(`Server is running on port ${PORT}`);
})