const express = require('express')
const {
    getRecentChannels,
    getChannelMessages,
    sendDirectMessage,
    findChannelsByUsername
} = require('../controllers/chatController.js')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// require auth for all section routes
router.use(requireAuth)

// GET recent channels
router.get('/recent', getRecentChannels)

// GET message
router.get('/:id', getChannelMessages)

// GET channels by username
router.get('/search-user/:user', findChannelsByUsername)

// POST message
router.post('/dm/:id', sendDirectMessage)

module.exports = router