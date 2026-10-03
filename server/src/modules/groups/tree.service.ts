import { TREE_MAX, TREE_STEP, GroupModel } from '../../models/index.js'
import { realtime } from '../../realtime/notifier.js'

async function notifyMembers(groupId: string) {
  const g = await GroupModel.findById(groupId).select('members').lean()
  if (g) realtime.toUsers(g.members.map(String), 'groups:changed', { groupId })
}

/**
 * Called when a member completes (+1) or un-completes (-1) a task in the group.
 * Uses conditional atomic updates so concurrent completions can't over/under-shoot.
 */
export async function adjustTreeProgress(groupId: string, direction: 1 | -1): Promise<void> {
  const res = await GroupModel.updateOne(
    { _id: groupId, 'tree.isGrowing': true },
    { $inc: { 'tree.progress': direction * TREE_STEP } },
  )
  if (res.modifiedCount === 0) return

  if (direction === 1) {
    await GroupModel.updateOne(
      { _id: groupId, 'tree.isGrowing': true, 'tree.progress': { $gte: TREE_MAX } },
      { $set: { 'tree.isGrowing': false, 'tree.progress': TREE_MAX }, $inc: { 'tree.grown': 1 } },
    )
  } else {
    await GroupModel.updateOne(
      { _id: groupId, 'tree.progress': { $lt: 0 } },
      { $set: { 'tree.progress': 0 } },
    )
  }
  await notifyMembers(groupId)
}

/** Any member can plant a new tree once the previous one has finished growing. */
export async function plantTree(groupId: string, userId: string): Promise<boolean> {
  const res = await GroupModel.updateOne(
    { _id: groupId, members: userId, 'tree.isGrowing': { $ne: true } },
    { $set: { 'tree.isGrowing': true, 'tree.progress': 0 } },
  )
  if (res.modifiedCount > 0) await notifyMembers(groupId)
  return res.modifiedCount > 0
}
