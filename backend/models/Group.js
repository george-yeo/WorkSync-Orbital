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
        ref:'User',
        required: true
    },
    pendingID: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    requestID: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    membersID: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    chatChannelID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    groupPic: {
        type: String,
        default: '/9j/4AAQSkZJRgABAQEBLAEsAAD/4QBWRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAITAAMAAAABAAEAAAAAAAAAAAEsAAAAAQAAASwAAAAB/+0ALFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAPHAFaAAMbJUccAQAAAgAEAP/hDIFodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nIHg6eG1wdGs9J0ltYWdlOjpFeGlmVG9vbCAxMC4xMCc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczp0aWZmPSdodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyc+CiAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICA8dGlmZjpYUmVzb2x1dGlvbj4zMDAvMTwvdGlmZjpYUmVzb2x1dGlvbj4KICA8dGlmZjpZUmVzb2x1dGlvbj4zMDAvMTwvdGlmZjpZUmVzb2x1dGlvbj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6eG1wTU09J2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8nPgogIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnN0b2NrOmRjYWEwNWE2LTM3YmMtNGZiMi1hMGZjLTY0ZDM1NDc5N2Q0OTwveG1wTU06RG9jdW1lbnRJRD4KICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOjI0NDY0ZjhkLTgyZWEtNDEzZi05NTk2LThkZWM3ZWVkYzRjMDwveG1wTU06SW5zdGFuY2VJRD4KIDwvcmRmOkRlc2NyaXB0aW9uPgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSd3Jz8+/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/8AACwgBaAFoAQERAP/EABwAAQACAwEBAQAAAAAAAAAAAAAFBgIDBAEHCP/EADwQAQACAQIBCgQCBwkBAQAAAAABAgMEEQUGEhMhMUFRYYGhIlJxkTJCM0NicrHB0RQjJDVTc6Ky4RaT/9oACAEBAAA/AP00AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjtbxrhukma5NTW94/JjjnT7diK1HKuN9tNobT55b7e0buPJym4lafgppqR+5M/za/wD6Li2/6TB/+X/rZj5TcSrPx0014/cmP5uzT8q4321OhtHnivv7TsldFxrhurmK49TWl5/Jkjmz79qRAAAAAAAAAAABE8X45pdBM4q/3+oj9XWfw/We5VuI8U12vmYz5prjn9Vj+Gvr3z6uKIiI2iIiAAJiJjaYiYdvDuKa7QTEYM02xx+qyfFX0749Fp4RxzS6+YxW/uNRP6u09VvpPelgAAAAAAAAAB5MxEbzO0QqvHuUF8s203DrzXH2WzR228q+Xmr0REdgAABMRPasPAeUFsU103EL87H2VzT218reXmtUTExvE7xL0AAAAAAAAAFR5T8YnU3todLfbBWdst4n8c+EeX8UCAAAAnuTHGJ0166HVX3wWnbFefyT4T5fwW4AAAAAAAAAQXKzic6XTxpMFts+aOuY7aU75+s9ioRERG0dkAAAABMRMbT2St/JPic6rTzpM9t8+GOqZ7b07p+sdidAAAAAAAABhny0w4b5slubSlZtafCIfPNZqcms1eXVZfxZJ3iPljuj7NIAAAAN2j1OTR6vFqsX4sc77fNHfH2fQ8GWmbDTNjtzqXrFqz4xLMAAAAAAAAQHLTVdHoMekrPxZ7fF+7HXPvsqQAAAAAtvIvVdJoMmktPxYLfD+7PXHvunwAAAAAAABSeVubpuN3pv1YaVpH1nrn+MIkAAAAAS3JLN0PG6U36s1LUn6x1x/CV2AAAAAAAAHzvieTpeJ6vJ82a3tO38nOAAAAAOjhmTouJ6TJ8uavvO3830QAAAAAAAAfNcs75sk+OS0+8sQAAAABljnbNjmO7JWfeH0oAAABz4svN6rdn8G+JiY3h6AAAPm+przNVnpP5ct4/5S1gAAAADZpq8/VYKfNlpH/KH0gAAAGvLlivVHXLmZ48k0nxjwdFLRaN4lkAAAoPH8XQ8b1dNtom/Pj6Wjf8Aq4QAAAAB3cAxdNxvSU23iL8+fpWN/wCi/AAAPGnLl7qfdpB7W01neJb8eWLdU9UtoAAKny20/M1mDVRHVkrOO31jrj2mfsr4AAAAAsHInT8/V59VMdWOsY6z5z1z7RH3WwAAGN7RWN5lz5Mk36uyPBgADZjyzXqnrhvraLRvEsgAEfyg0c67heXFWN8lfjx/vR/Xs9VDid43AAAAAJnaN185P6OdDwrFitG2S3x5P3p/p2eiQAAeNWTNEdVeufFomZmd5neQAAImYneJ2bqZu6/3bomJjeJ3egApPKjQTouITlpXbBqJm1f2bd8fz+6JAAAABLcl9BOt4hGW9d8GnmLW8LW7o/n9l2AAa75a17OuWi97X7Z6vBiAAAD2tprO8Ts20z/NHrDdW0WjeJ3egObiWjxa/R302aOq3ZMdtZ7phQdXp82k1N9Nnrtkp9rR3THk1AAAANuk0+bV6mmm09d8l/tWO+Z8l+4bo8Wg0dNNhjqr2zPbae+ZdIDxhfLWOzrlpvktbv2jwYAAAAAETMTvE7Nlc1o7ettrlpPft9Wb0R3HOF4uJafaZimen6PJt2eU+SkanBm02e2n1FJpkr2x4+ceMNYAAA2abBm1OeuDT45yZLdkeHnPhC78D4Xi4bp9omL57/pMm3b5R5JEGNr1r2y1Wz/LH3arXtbtl4AAAAAAD2LTHZMwzrmtHbtLZXNWe2JhnF6T2Why8U4dpuI4Ojz1+KPwXr+Ks+Sm8V4Vq+HWmctekw92WsdXr4OEAAHdwrhWr4jaJxV6PD35bR1eniuXC+Habh2Ho8Fd7T+O9vxWnzdc2iO2YhhbLSO/f6MLZ57o+7XbJe3bZiAAAAAAAADG9q0rNr2itY7ZmdoR+o49w3BMxGp6S0d2KJt79jhzcq+qa4dHe8T/AKtoiJ9I3QGs1E583SYtPh03XvauPeYn07vRh0nk96SPA58eEnPjwk58eEnPjwedJ5M9FqP7Pm6TLp8Oq2netcm8RHpHb6rBh5WdUVzaK1Ij/StE7ek7O7Bx/h2eYidVOK092WJr79iQpat6xalotWeyYneHoAAAAAAAADk1/EdHoY/xGaIt3UjrtPogNbyj1OTeukxVwV+a/wAVvt2R7ofUZc2otztRmyZp/btv7djAAAABnp8ubT252nzZMM/sW29uxMaLlHqce1dXirnr81Pht9uyfZP6DiOj11f8Pmibd9J6rR6OsAAAAAAAGrVajBpcM5tRkrjpHfKs8T5QZ8++PRRODH88/jn6eCFnrtNpmZtPXMzO8z6gAAAAAR1Wi0TMWjriYnaY9U1wzlBnwbY9bE58fzx+OPr4/wAVm0uowarDGbT5K5KT3w2gAAAAAAjuMcWwcPpzf0ueY+HHE+8+EKjrdVqNZm6bU5Ofb8sflr9IaQAAAAAAbtFqtRo83TabJzLfmj8tvrC3cH4tg4hTm/os8R8WOZ948YSIAAAAACH4/wAYro4nT6fa2pmOue2MceM+fkqdrWve172m97Tva1p3mZeAAAAAAAD2trUvW9LWpes71tWdpiVr4BxiusiNPqdq6mI6p7IyR4x5+SZAAAAAETyh4rGhx9DgmJ1N46v2I8Z/kqEzMzNrTNrTO8zM9cz4gAAAAAAABEzExaszW0TvExPXE+K38nuKxrsfQ55iNTSOv9uPGP5pYAAAAHHxfXY+H6O2a0c689WOnzWUjLkyZst82a3PyXne0sQAAAAAAAAZYsmTDmpmw25mSk71ld+Ea7HxDR1zVjm3jqyU+WzsAAAAeWmK1m1piIiN5me5R+Ma63ENbOaJnoq/Dijy8fVxgAAAAAAAADs4PrrcP1tc0zPRW+HLHl4+i8VmLVi1ZiYmN4mO96AAACB5Xa3otPXRY52vmje/lT/3+qsAAAAAAAAAALPyR1vS6e2iyT8eGN6b99P/AD+ieAAAHlrVpWbWnasRvM+EKDr9TbWa3Lqrb/HPwx4VjshpAAAAAAAAAAbtDqbaPW4tVXf4J+KPGs9sL9W1b1i1Z3rMbxPjD0AABEcq9T0HC5xVna+e3M9O2fbq9VRAAAAAAAAAABbuSmp6fhcYrTvfBbmenbHt1eiXAAAVHlZn6XikYYn4cFIj1nrn22RAAAAAAAAAAAJfknn6Lis4Zn4c1Jj1jrj23W4AAB8/1mX+0azPn336TJaY+m/V7bNQAAAAAAAAAANujy/2fWYM++3R5KzP036/bd9AAABo4jl6HQajN8mK0+ygUjasR4Q9AAAAAAAAAAB5eN6zHjC/8Oy9NoNPm+fFWfZvAAEdyltzeB6nzrFfvMQpYAAAAAAAAAAAunJq3O4HpvKs1+0zCRAAETysnbguTzvSP+UKgAAAAAAAAAAALfyTnfguPyvf/tKWAAETyt/yW/8AuU/7QqAAAAAAAAAAAAt/JL/Jaf7l/wDtKWAf/9k=',
        validate: {
          validator: function(value) {
            // Validate the length and format of the base64 string
            return validator.isBase64(value) && value.length <= 10485760; // 10 MB limit for example
          },
          message: 'Invalid group picture. Ensure it is a base64 encoded string and not too large.'
        }
    },
    sectionID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Section'
    }
})

groupSchema.statics.createGroup = async function (name, user, sectionID) {
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
    
    const chatChannel = await this.model("ChatChannel").create({
        participants: [],
        type: "group",
    })
    chatChannel.addParticipant(user)
    
    const group = await this.create({
        name,
        createdByID: user._id,
        chatChannelID: chatChannel._id,
        sectionID
    })

    return group
}

// add a user to group chat
groupSchema.methods.addToChat = async function(user) {
    const chatChannel = await this.model("ChatChannel").findById(this.chatChannelID)
    chatChannel.addParticipant(user)
}

// remove a user from group chat
groupSchema.methods.removeFromChat = async function(userId) {
    const chatChannel = await this.model("ChatChannel").findById(this.chatChannelID)
    chatChannel.removeParticipant(userId)
}

// checks if user is pending to be added to group
groupSchema.methods.isPending = function(userId) {
    return this.pendingID.includes(userId)
}

// checks if user is pending request to join the group
groupSchema.methods.isRequesting = function(userId) {
    return this.requestID.includes(userId)
}

// add user into group
groupSchema.methods.addMember = async function(userId) {
    await Promise.all([
        this.model("Group").updateOne(
            { _id: this._id},
            { $pull: { pendingID: userId }},
        ),
        this.model("Group").updateOne(
            { _id: this._id},
            { $pull: { requestID: userId }},
        ),
        this.model("Group").updateOne(
            { _id: this._id},
            { $push: { membersID: userId }}
        ),
        this.addToChat(await this.model("User").findById(userId))
    ])
}

// remove user from group
groupSchema.methods.removeMember = async function(userId) {
    console.log(userId)
    await Promise.all([
        this.model("Group").updateOne(
            { _id: this._id},
            { $pull: { membersID: userId }}
        ),
        this.removeFromChat(userId)
    ])
}

// static find similar group names method
groupSchema.statics.findGroupByName = async function(name) {
    return this.find({ name: {"$regex": "^"+name, "$options": "i"} }).limit(8).exec()
  }

module.exports = mongoose.model('Group', groupSchema)