const express = require('express')
const {
  getAllTasks,
  getTask,
  createTask,
  deleteTask,
  updateTask,
} = require('../controllers/taskController.js')

const router = express.Router()

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
  
module.exports = router