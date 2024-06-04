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

    res.status(200).json({email, token, _id})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// signup a user
const signupUser = async (req, res) => {
  const {email, password, username} = req.body

  try {
    const user = await User.signup(email, password, username)

    // create a token
    const token = createToken(user._id)
    const _id = user._id

    res.status(200).json({email, token, _id})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const {email, password, username} = req.body

  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await User.findOneAndUpdate({_id: id}, {
        email, password: hash , username
    })

    res.status(200).json(user)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

module.exports = { signupUser, loginUser, updateUser }