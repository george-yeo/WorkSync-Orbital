import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

/**
 * A task belongs to exactly one owner and lives either in one of their personal lists (`list`)
 * or in a group they are a member of (`group`). Group-wide tasks created by a group owner are
 * fanned out as one task per member so each member tracks their own completion.
 */
const taskSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    list: { type: Schema.Types.ObjectId, ref: 'TaskList', default: null },
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    deadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

taskSchema.index({ owner: 1, createdAt: 1 })
taskSchema.index({ group: 1 })
taskSchema.index({ list: 1 })

export type Task = InferSchemaType<typeof taskSchema>
export type TaskDoc = HydratedDocument<Task>
export const TaskModel = model('Task', taskSchema)
