import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'

/** A personal task list (called a "section" in v1). */
const taskListSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

taskListSchema.index({ owner: 1, createdAt: 1 })

export type TaskList = InferSchemaType<typeof taskListSchema>
export type TaskListDoc = HydratedDocument<TaskList>
export const TaskListModel = model('TaskList', taskListSchema)
