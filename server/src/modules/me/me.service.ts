import { badRequest, forbidden, notFound, unauthorized } from '../../lib/http-error.js'
import { processAvatar } from '../../lib/images.js'
import { hashPassword, verifyPassword } from '../../lib/password.js'
import { UserModel } from '../../models/index.js'
import { toPrivateUser, type PrivateUserDto } from '../users/user.dto.js'
import { assertEmailAvailable, assertUsernameAvailable } from '../users/users.service.js'
import { deleteUserCascade } from '../users/account.service.js'

async function getUserOr404(userId: string) {
  const user = await UserModel.findById(userId)
  if (!user) throw notFound('User')
  return user
}

export async function getMe(userId: string): Promise<PrivateUserDto> {
  return toPrivateUser(await getUserOr404(userId))
}

export async function updateProfile(
  userId: string,
  patch: { username?: string; displayName?: string; email?: string },
): Promise<PrivateUserDto> {
  const user = await getUserOr404(userId)
  if (patch.email !== undefined && patch.email !== user.email) {
    if (user.isGuest) throw forbidden('Demo accounts cannot change their email')
    await assertEmailAvailable(patch.email, userId)
    user.email = patch.email
  }
  if (patch.username !== undefined && patch.username !== user.username) {
    await assertUsernameAvailable(patch.username, userId)
    user.username = patch.username
  }
  if (patch.displayName !== undefined) user.displayName = patch.displayName
  await user.save()
  return toPrivateUser(user)
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await UserModel.findById(userId).select('+passwordHash')
  if (!user) throw notFound('User')
  if (user.isGuest) throw forbidden('Demo accounts cannot change their password')
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw badRequest('Current password is incorrect', {
      fields: { currentPassword: 'Incorrect password' },
    })
  }
  if (currentPassword === newPassword) throw badRequest('New password must be different')
  user.passwordHash = await hashPassword(newPassword)
  await user.save()
}

export async function setAvatar(userId: string, file: Buffer | undefined): Promise<PrivateUserDto> {
  if (!file) throw badRequest('No image uploaded')
  const data = await processAvatar(file)
  const user = await getUserOr404(userId)
  user.avatar = { data, contentType: 'image/webp' }
  user.avatarVersion = (user.avatarVersion ?? 0) + 1
  await user.save()
  return toPrivateUser(user)
}

export async function removeAvatar(userId: string): Promise<PrivateUserDto> {
  const user = await getUserOr404(userId)
  user.avatar = undefined
  user.avatarVersion = null
  await user.save()
  return toPrivateUser(user)
}

export async function deleteAccount(userId: string, password: string | undefined) {
  const user = await UserModel.findById(userId).select('+passwordHash')
  if (!user) throw notFound('User')
  if (!user.isGuest && !(await verifyPassword(password ?? '', user.passwordHash))) {
    throw unauthorized('Password is incorrect')
  }
  await deleteUserCascade(userId)
}
