const mongoose = require('mongoose')
const validator = require('validator')

const Schema = mongoose.Schema

const groupSchema = new Schema ({
    name: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: String,
        required: true
    },
    pending: {
        type: [Schema.Types.ObjectId]
    },
    members: {
        type: [Schema.Types.ObjectId]
    }
})

groupSchema.statics.createGroup = async function (name, createdBy) {
    if (!validator.isAlphanumeric(name)) {
        throw Error('Group name can only contain contains only letters and numbers (a-z A-Z 0-9)')
    }
    if (!validator.isLength(name, { min: 4, max: 20 })) {
        throw Error('Group name must be 4-20 characters long')
    }

    const group = await this.create(name, createdBy)
    
    return group
}

module.exports = mongoose.model('Group', groupSchema)