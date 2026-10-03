import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    username: { type: String, required: true, trim: true },
    /** Lower-cased username, used for case-insensitive uniqueness and prefix search. */
    usernameLower: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatar: {
      type: { data: Buffer, contentType: String },
      select: false,
      default: undefined,
    },
    /** Incremented on every avatar change; used for cache-busting. null = no avatar. */
    avatarVersion: { type: Number, default: null },
    /** Demo accounts: guests are ephemeral visitors, seed users are fixtures. */
    isGuest: { type: Boolean, default: false },
    isSeed: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ usernameLower: 1 }, { unique: true })
userSchema.index({ isGuest: 1, expiresAt: 1 })

userSchema.pre('validate', function () {
  if (this.isModified('username')) this.usernameLower = this.username.toLowerCase()
})

export type User = InferSchemaType<typeof userSchema>
export type UserDoc = HydratedDocument<User>
export const UserModel = model('User', userSchema)
