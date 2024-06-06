const express = require('express')

// controller functions
const {
    loginUser,
    signupUser,
    updateUser,
    searchUsername,
} = require('../controllers/userController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// login route
router.post('/login', loginUser)

// signup route
router.post('/signup', signupUser)

// update route
router.patch('/update/:id', requireAuth, updateUser)

// search username, needs auth
router.get('/search/:user', searchUsername)

module.exports = router