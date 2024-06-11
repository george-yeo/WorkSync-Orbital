const express = require('express')

const {
    createGroup,
    addUser,
    acceptGroup
} = require('../controllers/groupController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

//create route
router.post('/create', createGroup)

//add user route
router.patch('/add', addUser)

//accept route
router.patch('/accept', acceptGroup)

module.exports = router