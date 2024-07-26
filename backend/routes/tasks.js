const express = require('express')
const {
  getAllTasks,
  getTask,
  createTask,
  deleteTask,
  updateTask,
  getGroupTasks,
  createGroupTask
} = require('../controllers/taskController.js')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// require auth for all task routes
router.use(requireAuth)

// GET all tasks
router.get('/', getAllTasks)

// GET a single task
router.get('/:id', getTask)
  
// POST a new task
router.post('/', createTask)
  
// DELETE a task
router.delete('/:id', deleteTask)
  
// UPDATE a task
router.patch('/:id', updateTask)

// POST a new group task
router.post('/createGroupTask', createGroupTask)

// //get group tasks
// router.get('/getGroupTasks/:sectionId', getGroupTasks)
  
module.exports = router