import { conflict } from '../../lib/http-error.js'
import { prefixQuery } from '../../lib/strings.js'
import { UserModel } from '../../models/index.js'
import { PUBLIC_USER_FIELDS, toPublicUser, type PublicUserDto } from './user.dto.js'
import { visibleUsersFilter, type Viewer } from './visibility.js'

export async function searchUsers(q: string, viewer: Viewer): Promise<PublicUserDto[]> {
  const users = await UserModel.find({
    ...visibleUsersFilter(viewer),
    usernameLower: prefixQuery(q),
    _id: { $ne: viewer.userId },
  })
    .select(PUBLIC_USER_FIELDS)
    .sort({ usernameLower: 1 })
    .limit(8)
    .lean()
  return users.map(toPublicUser)
}

export async function assertUsernameAvailable(username: string, exceptUserId?: string) {
  const existing = await UserModel.findOne({ usernameLower: username.toLowerCase() })
    .select('_id')
    .lean()
  if (existing && String(existing._id) !== exceptUserId) throw conflict('That username is taken')
}

export async function assertEmailAvailable(email: string, exceptUserId?: string) {
  const existing = await UserModel.findOne({ email }).select('_id').lean()
  if (existing && String(existing._id) !== exceptUserId)
    throw conflict('That email is already registered')
}
