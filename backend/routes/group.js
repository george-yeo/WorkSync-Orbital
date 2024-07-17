const express = require('express')

const {
    createGroup,
    addUser,
    acceptGroup,
    getAllGroups,
    getGroupData,
    getInvite,
    rejectGroup,
    removeMember,
    deleteGroup,
    searchGroup,
    getRequest,
    joinGroup,
    acceptUser,
    rejectUser,
    plantTree,
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

//get invite
router.get('/invite', getInvite)

//remove member
router.patch('/remove/:id', removeMember)

//delete group
router.delete('/delete/:id', deleteGroup)

//search group
router.get('/search/:group', searchGroup)

//join group
router.patch('/join/:id', joinGroup)

//get request
router.get('/request', getRequest)

//accept user
router.patch('/acceptUser/:id', acceptUser)

//reject user
router.patch('/rejectUser/:id', rejectUser)

//get group details
router.get('/:id', getGroupData)

//plant tree
router.patch('/plant-tree/:id', plantTree)

module.exports = router