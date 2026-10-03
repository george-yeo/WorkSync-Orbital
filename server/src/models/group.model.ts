import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

export const TREE_STEP = 10
export const TREE_MAX = 100

export const groupNameKey = (name: string, demoOwner: string | null) =>
  demoOwner ? `${name.toLowerCase()}~${demoOwner}` : name.toLowerCase()

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** All members, including the owner. */
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** Users the owner has invited who haven't responded yet. */
    invites: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** Users who asked to join a public group. */
    requests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPrivate: { type: Boolean, default: true },
    chatChannel: { type: Schema.Types.ObjectId, ref: 'ChatChannel', default: null },
    tree: {
      isGrowing: { type: Boolean, default: false },
      progress: { type: Number, default: 0, min: 0, max: TREE_MAX },
      grown: { type: Number, default: 0, min: 0 },
    },
    avatar: {
      type: { data: Buffer, contentType: String },
      select: false,
      default: undefined,
    },
    avatarVersion: { type: Number, default: null },
    /**
     * Demo sandboxes: set to the guest user a group belongs to. Such groups are invisible to
     * everyone else and are deleted with the guest. Their nameLower is suffixed so they never
     * collide with real group names.
     */
    demoOwner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

groupSchema.index({ nameLower: 1 }, { unique: true })
groupSchema.index({ members: 1 })
groupSchema.index({ invites: 1 })
groupSchema.index({ demoOwner: 1 })

groupSchema.pre('validate', function () {
  if (this.isModified('name') || this.isModified('demoOwner')) {
    this.nameLower = groupNameKey(this.name, this.demoOwner ? String(this.demoOwner) : null)
  }
})

export type Group = InferSchemaType<typeof groupSchema>
export type GroupDoc = HydratedDocument<Group>
export const GroupModel = model('Group', groupSchema)
