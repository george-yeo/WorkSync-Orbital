const express = require('express')

const {
    createGroup,
    addUser,
    acceptGroup,
    getAllGroups,
    getRequest,
    rejectGroup
} = require('../controllers/groupController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)

//create route
router.post('/create', createGroup)

//add user route
router.patch('/add/:id', addUser)

//accept route
router.patch('/accept/:id', acceptGroup)

//reject route
router.patch('/reject/:id', rejectGroup)

//get groups
router.get('/',getAllGroups)

//get request
router.get('/request', getRequest)

module.exports = router