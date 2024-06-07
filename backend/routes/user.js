const express = require('express')

// controller functions
const {
    loginUser,
    signupUser,
    updateUser,
    searchUsername,
    getUser,
    changePassword
} = require('../controllers/userController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// login route
router.post('/login', loginUser)

// signup route
router.post('/signup', signupUser)

// update route
router.patch('/update/:id', requireAuth, updateUser)

//change password
router.patch('/changePassword/:id',requireAuth, changePassword)

// search username, needs auth
router.get('/search/:user', searchUsername)

// get user
router.get('/getUser/:id', getUser)

module.exports = router