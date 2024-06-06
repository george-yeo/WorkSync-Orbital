const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  displayname: {
    type: String,
    default: ''
  },
  recentChatChannels: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatChannel",
        default: []
    }
  ],
  gender: {
    type: String,
    enum: ["male", "female", "others"]
  },
  profilePic: {
    type: String,
    default: ''
  }
})

// static signup method
userSchema.statics.signup = async function(email, password, confirmPassword, username) {

  //validation
  if (!email || !password || !confirmPassword || !username) {
    throw Error('All fields must be filled')
  }
  if (!validator.isEmail(email)) {
    throw Error('Email not valid')
  }
  if (password !== confirmPassword) {
    throw Error('Passwords do not match')
  }
  //strongPassword is length 7 with uppercase, lowercase, number and special char
  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }
  if (!validator.isAlphanumeric(username)) {
    throw Error('Username can only contain contains only letters and numbers (a-z A-Z 0-9)')
  }
  if (!validator.isLength(username, { min: 4, max: 20 })) {
    throw Error('Username must be 4-20 characters long')
  }

  const exists = await this.findOne({ email })

  if (exists) {
    throw Error('Email already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({ email, password: hash , username})

  return user
}

// static login method
userSchema.statics.login = async function(email, password) {

  if (!email || !password) {
    throw Error('All fields must be filled')
  }

  const user = await this.findOne({ email })
  if (!user) {
    throw Error('Incorrect email')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw Error('Incorrect password')
  }

  return user
}

// static find similar usernames method
userSchema.statics.findUserByUsername = async function(username) {
  return this.find({ username: {"$regex": "^"+username, "$options": "i"} }).limit(8).exec()
}

// get safe userdata method
userSchema.methods.getSafeData = function() {
  return {
    username: this.username,
    profilePic: this.profilePic,
    _id: this._id,
  }
}

module.exports = mongoose.model('User', userSchema)