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
    leaveGroup,
    deleteGroup,
    searchGroup,
    getRequest,
    cancelRequest,
    joinGroup,
    acceptUser,
    rejectUser,
    revokeInvite,
    plantTree,
    setPrivacy,
    setName,
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

//revoke invite
router.patch('/revoke/:id', revokeInvite)

//leave group
router.patch('/leave/:id', leaveGroup)

//delete group
router.delete('/delete/:id', deleteGroup)

//search group
router.get('/search/:group', searchGroup)

//join group
router.patch('/join/:id', joinGroup)

//cancel request
router.patch('/cancel/:id', cancelRequest)

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

//set privacy
router.patch('/privacy/:id', setPrivacy)

//change name
router.patch('/rename/:id', setName)

module.exports = router