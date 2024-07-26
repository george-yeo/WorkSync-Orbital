import { useAuthContext } from './useAuthContext'
import { useChatContext } from './useChatContext'
import { useGroupContext } from './useGroupContext'
import { useGroupPageContext } from './useGroupPageContext'
import { useSectionContext } from './useSectionContext'
import { useTaskContext } from './useTaskContext'

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const chatContext = useChatContext()
  const groupContext = useGroupContext()
  const groupPageContext = useGroupPageContext()
  const sectionContext = useSectionContext()
  const taskContext = useTaskContext()

  const logout = () => {
    // remove user from storage
    localStorage.removeItem('user')

    // dispatch logout action
    dispatch({ type: 'LOGOUT' })
    chatContext.dispatch({ type: 'RESET'})
    groupContext.dispatch({ type: 'RESET'})
    groupPageContext.dispatch({ type: 'RESET'})
    sectionContext.dispatch({ type: 'RESET'})
    taskContext.dispatch({ type: 'RESET'})
  }

  return { logout }
}