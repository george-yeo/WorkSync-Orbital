import { Eye, EyeOff } from 'lucide-react'
import { IconButton } from '../../components/ui/Button'

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <IconButton label={shown ? 'Hide password' : 'Show password'} onClick={onToggle}>
      {shown ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
    </IconButton>
  )
}
