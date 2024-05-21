<<<<<<< HEAD
const express = require('express')
=======
require('dotenv').config()

const express =  require('express')
>>>>>>> 814f68a093e0fcb7814c2d67d59ea36d181fc307

// express app
const app = express()

<<<<<<< HEAD
// listen for requests
app.listen(4000, () => {
    console.log('listening on port 4000')
=======
// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.get('/', (req, res) => {
    res.json({mssg: 'Welcome to the app'})
})

// listen for requests
app.listen(process.env.PORT, () => {
    console.log('listening on port', process.env.PORT)
>>>>>>> 814f68a093e0fcb7814c2d67d59ea36d181fc307
})