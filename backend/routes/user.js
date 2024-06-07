const express = require('express')
const multer = require('multer')

// controller functions
const {
    loginUser,
    signupUser,
    updateUser,
    searchUsername,
    getUser,
    changePassword,
    uploadProfilePic
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

// Multer setup for file upload
const storage = multer.memoryStorage() // Store file in memory buffer temporarily
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit size to 10MB
})

router.patch('/upload-profile-pic/:id', upload.single('profilePic'), uploadProfilePic)

module.exports = router