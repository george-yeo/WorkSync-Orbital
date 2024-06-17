const mongoose = require('mongoose')
const validator = require('validator')

const Schema = mongoose.Schema

const groupSchema = new Schema ({
    name: {
        type: String,
        required: true,
        unique: true
    },
    createdByID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    pendingID: {
        type: [Schema.Types.ObjectId]
    },
    pending:{
        type: [String]
    },
    membersID: {
        type: [Schema.Types.ObjectId]
    },
    members:{
        type: [String]
    }
})

groupSchema.statics.createGroup = async function (name, createdBy, createdByID) {
    if (!validator.isAlphanumeric(name)) {
        throw Error('Group name can only contain contains only letters and numbers (a-z A-Z 0-9)')
    }
    if (!validator.isLength(name, { min: 4, max: 20 })) {
        throw Error('Group name must be 4-20 characters long')
    }
    
    const exist = await this.findOne({ name })
    if (exist) {
        throw Error('Group name already in use')
    }

    const group = await this.create({name, createdByID, membersID: createdByID, members: createdBy})
    
    return group
}

module.exports = mongoose.model('Group', groupSchema)