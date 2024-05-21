const express = require('express')
const Task = require('../models/Task')

const router = express.Router()

// GET all tasks
router.get('/', (req, res) => {
  res.json({mssg: 'GET all tasks'})
})

// GET a single task
router.get('/:id', (req, res) => {
  res.json({mssg: 'GET a single task'})
})
  
// POST a new task
router.post('/', async (req, res) => {
  const {title, description, deadline, isCompleted} = req.body

  try {
    const task = await Task.create({title, description, deadline, isCompleted})
    res.status(200).json(task)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
})
  
// DELETE a task
router.delete('/:id', (req, res) => {
  res.json({mssg: 'DELETE a task'})
})
  
// UPDATE a task
router.patch('/:id', (req, res) => {
  res.json({mssg: 'UPDATE a task'})
})
  
module.exports = router