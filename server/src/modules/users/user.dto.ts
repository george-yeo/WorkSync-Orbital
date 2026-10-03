import type { Types } from 'mongoose'

export interface UserLike {
  _id: Types.ObjectId
  username: string
  displayName: string
  avatarVersion?: number | null
}

export interface PublicUserDto {
  id: string
  username: string
  displayName: string
  avatarVersion: number | null
}

export interface PrivateUserDto extends PublicUserDto {
  email: string
  isGuest: boolean
  createdAt: string
}

/** Fields safe to expose to any authenticated user. Never includes email or password hash. */
export const PUBLIC_USER_FIELDS = '_id username displayName avatarVersion'

export function toPublicUser(u: UserLike): PublicUserDto {
  return {
    id: String(u._id),
    username: u.username,
    displayName: u.displayName || u.username,
    avatarVersion: u.avatarVersion ?? null,
  }
}

export function toPrivateUser(
  u: UserLike & { email: string; isGuest?: boolean; createdAt?: Date },
): PrivateUserDto {
  return {
    ...toPublicUser(u),
    email: u.email,
    isGuest: Boolean(u.isGuest),
    createdAt: (u.createdAt ?? new Date()).toISOString(),
  }
}
