require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const taskRoutes = require('./routes/tasks')
const sectionRoutes = require('./routes/section')
const userRoutes = require('./routes/user')
const chatRoutes = require('./routes/chat')

// express app
const app = express()

// middleware
app.use(express.json())

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  } else if (err) {
    return res.status(500).json({ error: err.message })
  }
  next()
})

// routes
app.use('/api/tasks', taskRoutes)
app.use('/api/sections', sectionRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/user', userRoutes)

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('connected to db & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  })