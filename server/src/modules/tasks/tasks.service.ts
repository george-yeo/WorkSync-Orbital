import { badRequest, notFound } from '../../lib/http-error.js'
import { GroupModel, TaskListModel, TaskModel } from '../../models/index.js'
import { realtime } from '../../realtime/notifier.js'
import { adjustTreeProgress } from '../groups/tree.service.js'
import { toTaskDto, type TaskDto } from './task.dto.js'

const MAX_TASKS = 1000

export async function listTasks(userId: string): Promise<TaskDto[]> {
  const tasks = await TaskModel.find({ owner: userId }).sort({ createdAt: 1 }).lean()
  return tasks.map(toTaskDto)
}

export async function createTask(
  userId: string,
  input: {
    title: string
    description: string
    deadline: Date | null
    listId?: string
    groupId?: string
  },
): Promise<TaskDto> {
  if ((await TaskModel.countDocuments({ owner: userId })) >= MAX_TASKS) {
    throw badRequest(`You can have at most ${MAX_TASKS} tasks`)
  }
  if (input.listId && !(await TaskListModel.exists({ _id: input.listId, owner: userId }))) {
    throw notFound('List')
  }
  if (input.groupId && !(await GroupModel.exists({ _id: input.groupId, members: userId }))) {
    throw notFound('Group')
  }
  const task = await TaskModel.create({
    owner: userId,
    list: input.listId ?? null,
    group: input.groupId ?? null,
    title: input.title,
    description: input.description,
    deadline: input.deadline,
  })
  return toTaskDto(task)
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: { title?: string; description?: string; deadline?: Date | null; completed?: boolean },
): Promise<TaskDto> {
  // Scoped by owner: v1 let any user edit any task id, and spread req.body into the update.
  const task = await TaskModel.findOne({ _id: taskId, owner: userId })
  if (!task) throw notFound('Task')

  const wasCompleted = task.completedAt !== null
  if (patch.title !== undefined) task.title = patch.title
  if (patch.description !== undefined) task.description = patch.description
  if (patch.deadline !== undefined) task.deadline = patch.deadline
  if (patch.completed !== undefined) task.completedAt = patch.completed ? new Date() : null
  await task.save()

  const isCompleted = task.completedAt !== null
  if (task.group && isCompleted !== wasCompleted) {
    await adjustTreeProgress(String(task.group), isCompleted ? 1 : -1)
  }
  return toTaskDto(task)
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const task = await TaskModel.findOneAndDelete({ _id: taskId, owner: userId })
  if (!task) throw notFound('Task')
}

/** Group owner assigns a task to every member (each gets their own copy to complete). */
export async function assignTaskToGroup(
  groupId: string,
  assignerId: string,
  memberIds: string[],
  input: { title: string; description: string; deadline: Date | null },
): Promise<void> {
  await TaskModel.insertMany(
    memberIds.map((owner) => ({
      owner,
      group: groupId,
      assignedBy: assignerId,
      title: input.title,
      description: input.description,
      deadline: input.deadline,
    })),
  )
  realtime.toUsers(memberIds, 'tasks:changed')
}
