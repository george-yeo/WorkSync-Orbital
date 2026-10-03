import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  Link,
} from 'react-router'
import { useAuth } from './auth/AuthProvider'
import { AppShell, Logo } from './components/layout/AppShell'
import { buttonClass } from './components/ui/Button'
import { PageSpinner } from './components/ui/Spinner'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { SocketProvider } from './realtime/SocketProvider'

function RequireAuth() {
  const { token, user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading)
    return (
      <div className="flex h-dvh items-center justify-center">
        <PageSpinner />
      </div>
    )
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  )
}

function GuestOnly() {
  const { token, user } = useAuth()
  if (token && user) return <Navigate to="/" replace />
  return <Outlet />
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <Logo />
      <h1 className="text-3xl font-bold">Nothing grows here</h1>
      <p className="max-w-sm text-muted">
        This page doesn't exist. It may have moved, or the link is wrong.
      </p>
      <Link to="/" className={buttonClass()}>
        Go to your tasks
      </Link>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        hydrateFallbackElement: <PageSpinner />,
        children: [
          // Each page is its own chunk, so the login screen loads fast.
          { path: '/', lazy: () => import('./features/tasks/TasksPage').then((m) => ({ Component: m.TasksPage })) },
          { path: '/groups', lazy: () => import('./features/groups/GroupsPage').then((m) => ({ Component: m.GroupsPage })) },
          { path: '/groups/:id', lazy: () => import('./features/groups/GroupPage').then((m) => ({ Component: m.GroupPage })) },
          { path: '/chat', lazy: () => import('./features/chat/ChatPage').then((m) => ({ Component: m.ChatPage })) },
          { path: '/profile', lazy: () => import('./features/profile/ProfilePage').then((m) => ({ Component: m.ProfilePage })) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export function App() {
  return <RouterProvider router={router} />
}
