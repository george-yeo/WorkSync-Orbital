const User = require('../models/User')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const checkValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}
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
    const user = await User.findOneAndUpdate({_id: id}, {
      email, username, displayname, gender
    })

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

module.exports = { signupUser, loginUser, updateUser, searchUsername, getUser }