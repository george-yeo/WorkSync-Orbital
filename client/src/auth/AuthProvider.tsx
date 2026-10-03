import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api'
import type { Me, Session } from '../lib/types'

interface AuthState {
  token: string | null
  user: Me | null
  isLoading: boolean
  startSession: (session: Session) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(tokenStore.get)

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/me'),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const logout = useCallback(() => {
    tokenStore.set(null)
    setToken(null)
    queryClient.clear()
  }, [queryClient])

  const startSession = useCallback(
    (session: Session) => {
      queryClient.clear()
      tokenStore.set(session.token)
      queryClient.setQueryData(['me'], session.user)
      setToken(session.token)
    },
    [queryClient],
  )

  useEffect(() => setUnauthorizedHandler(logout), [logout])

  const value = useMemo<AuthState>(
    () => ({
      token,
      user: token ? (me.data ?? null) : null,
      isLoading: Boolean(token) && me.isPending,
      startSession,
      logout,
    }),
    [token, me.data, me.isPending, startSession, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** For components rendered only inside authenticated routes. */
export function useMe(): Me {
  const { user } = useAuth()
  if (!user) throw new Error('useMe used outside an authenticated route')
  return user
}
