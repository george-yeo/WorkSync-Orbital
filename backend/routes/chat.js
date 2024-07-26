const express = require('express')
const {
    getRecentChannels,
    getChannelMessages,
    sendDirectMessage,
    sendGroupMessage,
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

// POST direct message
router.post('/dm/:id', sendDirectMessage)

// POST group message
router.post('/gm/:id', sendGroupMessage)

module.exports = router