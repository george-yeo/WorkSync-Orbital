const User = require('../models/User')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const createToken = (_id) => {
  return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' })
}


// login a user
const loginUser = async (req, res) => {
  const {email, password} = req.body

  try {
    const user = await User.login(email, password)

    // create a token
    const token = createToken(user._id)
    const _id = user._id
    const username = user.username

    res.status(200).json({email, token, _id, username})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// signup a user
const signupUser = async (req, res) => {
  const {email, password, confirmPassword, username} = req.body

  try {
    const user = await User.signup(email, password, confirmPassword, username)

    // create a token
    const token = createToken(user._id)
    const _id = user._id

    res.status(200).json({email, token, _id, username})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const {email, username, displayname, gender} = req.body

  try {
    if (!email || !username) {
      throw Error('Email and Username cannot be empty')
    }
    if (!validator.isEmail(email)) {
      throw Error('Email not valid')
    }
    if (!validator.isAlphanumeric(username)) {
      throw Error('Username can only contain contains only letters and numbers (a-z A-Z 0-9)')
    }
    if (!validator.isLength(username, { min: 4, max: 20 })) {
      throw Error('Username must be 4-20 characters long')
    }
    
    const user = await User.findOneAndUpdate({_id: id}, {
      email, username, displayname, gender
    })

    res.status(200).json(await User.find({_id: id }))
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const changePassword = async (req, res) => {
  const { id } = req.params
  const { currPassword, newPassword, confirmPassword } = req.body

  try {
    if (!currPassword || !newPassword || !confirmPassword){
      throw Error('All fields must be filled')
    }
    if (currPassword === newPassword) {
      throw Error('New password same as current password')
    }
    const user = await User.findOne({_id: id })
    const match = await bcrypt.compare(currPassword, user.password)
    if (!match) {
      throw Error('Incorrect password')
    }

    if (newPassword != confirmPassword) {
      throw Error('Password do not match')
    }

    if (!validator.isStrongPassword(newPassword)) {
      throw Error('Password not strong enough')
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(newPassword, salt)

    await User.findOneAndUpdate({_id: id}, { password:hash })

    res.status(200).json(await User.find({_id: id }))
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const getUser =  async (req, res) => {
  const { id } = req.params

  const user = await User.find({ _id : id })

  res.status(200).json(await User.find({_id: id }))
}

const searchUsername = async (req, res) => {
  try {
    const { user: username } = req.params

    const users = await User.findUserByUsername(username)
    
    const safeUsers = users.map(user => user.getSafeData())

    res.status(200).json(safeUsers)
  } catch (error) {
    console.log("searchUsername error: ", error.message)
    res.status(500).json({error: error.message})
  }
}

const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!req.file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      throw Error('Only image files are allowed!')
    }
    // Convert file buffer to Base64 string
    const base64String = req.file.buffer.toString('base64')

    const { id } = req.params

    await User.findOneAndUpdate({_id: id}, { profilePic:base64String })

    res.status(200).json({ message: 'Profile picture updated successfully' })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { signupUser, loginUser, updateUser, searchUsername, getUser, changePassword , uploadProfilePic}