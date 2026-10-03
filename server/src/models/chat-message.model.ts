import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

const chatMessageSchema = new Schema(
  {
    channel: { type: Schema.Types.ObjectId, ref: 'ChatChannel', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// Supports cursor pagination: newest-first within a channel.
chatMessageSchema.index({ channel: 1, createdAt: -1, _id: -1 })
chatMessageSchema.index({ sender: 1 })

export type ChatMessage = InferSchemaType<typeof chatMessageSchema>
export type ChatMessageDoc = HydratedDocument<ChatMessage>
export const ChatMessageModel = model('ChatMessage', chatMessageSchema)
