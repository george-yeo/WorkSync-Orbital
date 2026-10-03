import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthProvider'
import { api, ApiError } from '../../lib/api'
import type { Session } from '../../lib/types'

export function useSessionMutation<V>(path: string) {
  const { startSession } = useAuth()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: V) => api.post<Session>(path, body as Record<string, unknown>),
    onSuccess: (session) => {
      startSession(session)
      navigate('/', { replace: true })
    },
  })
}

export const fieldErrors = (err: unknown) => (err instanceof ApiError ? err.fields : {})
