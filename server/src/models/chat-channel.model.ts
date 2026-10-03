import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

const chatChannelSchema = new Schema(
  {
    type: { type: String, enum: ['direct', 'group'], required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** For direct channels: the two user ids sorted and joined, so a pair can only have one channel. */
    directKey: { type: String, default: undefined },
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    lastMessage: {
      type: {
        text: String,
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
        at: Date,
      },
      default: null,
    },
    /** Bumped whenever a message is sent; drives "recent chats" ordering. */
    lastActivityAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)

chatChannelSchema.index({ directKey: 1 }, { unique: true, sparse: true })
chatChannelSchema.index({ participants: 1, lastActivityAt: -1 })

export const directKeyFor = (a: string, b: string) => [a, b].sort().join(':')

export type ChatChannel = InferSchemaType<typeof chatChannelSchema>
export type ChatChannelDoc = HydratedDocument<ChatChannel>
export const ChatChannelModel = model('ChatChannel', chatChannelSchema)
