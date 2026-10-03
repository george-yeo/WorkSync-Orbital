import { unauthorized } from '../../lib/http-error.js'
import { signToken } from '../../lib/jwt.js'
import { getDummyHash, hashPassword, verifyPassword } from '../../lib/password.js'
import { UserModel } from '../../models/index.js'
import { toPrivateUser, type PrivateUserDto } from '../users/user.dto.js'
import { assertEmailAvailable, assertUsernameAvailable } from '../users/users.service.js'

export interface Session {
  token: string
  user: PrivateUserDto
}

export async function signup(input: {
  email: string
  username: string
  password: string
}): Promise<Session> {
  await assertEmailAvailable(input.email)
  await assertUsernameAvailable(input.username)

  const user = await UserModel.create({
    email: input.email,
    username: input.username,
    usernameLower: input.username.toLowerCase(),
    displayName: input.username,
    passwordHash: await hashPassword(input.password),
  })
  return { token: signToken(String(user._id)), user: toPrivateUser(user) }
}

export async function login(input: { email: string; password: string }): Promise<Session> {
  const user = await UserModel.findOne({ email: input.email, isSeed: false }).select(
    '+passwordHash',
  )
  // Always run a hash comparison so response time doesn't reveal whether the email exists,
  // and return one generic message for both cases (v1 leaked "Incorrect email").
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()))
  if (!user || !ok || user.isGuest) throw unauthorized('Invalid email or password')
  return { token: signToken(String(user._id)), user: toPrivateUser(user) }
}
