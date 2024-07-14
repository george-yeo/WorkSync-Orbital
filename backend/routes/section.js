const express = require('express')
const {
  getAllSections,
  getSection,
  createSection,
  deleteSection,
  updateSection,
  createGroupSection,
  getGroupSection
} = require('../controllers/sectionController.js')
const requireAuth = require('../middleware/requireAuth.js')

const router = express.Router()

// require auth for all section routes
router.use(requireAuth)

// GET all sections
router.get('/', getAllSections)

// GET a single section
router.get('/:id', getSection)
  
// POST a new section
router.post('/', createSection)
  
// DELETE a section
router.delete('/:id', deleteSection)
  
// UPDATE a section
router.patch('/:id', updateSection)

// GET group section
router.get('/getGroupSection/:id', getGroupSection)

// POST a new group section
router.post('/createGroupSection', createGroupSection)
  
module.exports = router