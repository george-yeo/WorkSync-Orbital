import type { Types } from 'mongoose'
import type { Task } from '../../models/index.js'

export interface TaskDto {
  id: string
  title: string
  description: string
  deadline: string | null
  completedAt: string | null
  listId: string | null
  groupId: string | null
  assignedBy: string | null
  createdAt: string
  updatedAt: string
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)
const idOrNull = (v: Types.ObjectId | null | undefined) => (v ? String(v) : null)

export function toTaskDto(t: Task & { _id: Types.ObjectId }): TaskDto {
  return {
    id: String(t._id),
    title: t.title,
    description: t.description ?? '',
    deadline: iso(t.deadline),
    completedAt: iso(t.completedAt),
    listId: idOrNull(t.list),
    groupId: idOrNull(t.group),
    assignedBy: idOrNull(t.assignedBy),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}
