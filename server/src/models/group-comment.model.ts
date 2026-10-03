import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

const groupCommentSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

groupCommentSchema.index({ group: 1, createdAt: -1 })

export type GroupComment = InferSchemaType<typeof groupCommentSchema>
export type GroupCommentDoc = HydratedDocument<GroupComment>
export const GroupCommentModel = model('GroupComment', groupCommentSchema)
