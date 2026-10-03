import { Upload } from 'lucide-react'
import { useRef } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toaster'

const MAX_BYTES = 5 * 1024 * 1024

interface ImagePickerProps {
  kind: 'user' | 'group'
  id: string
  name: string
  version: number | null
  busy: boolean
  onPick: (file: File) => void
  onRemove?: () => void
}

export function ImagePicker({ kind, id, name, version, busy, onPick, onRemove }: ImagePickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const toast = useToast()
  return (
    <div className="flex items-center gap-4">
      <Avatar kind={kind} id={id} name={name} version={version} size="xl" />
      <div className="flex flex-col items-start gap-2">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (file.size > MAX_BYTES) {
              toast.error('That image is larger than 5 MB. Please choose a smaller one.')
              return
            }
            onPick(file)
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<Upload className="size-4" />}
          loading={busy}
          onClick={() => input.current?.click()}
        >
          Upload a picture
        </Button>
        {onRemove && version !== null && (
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={busy}>
            Remove picture
          </Button>
        )}
        <p className="text-xs text-muted">
          PNG, JPEG, WebP or GIF, up to 5 MB. It's cropped to a square.
        </p>
      </div>
    </div>
  )
}
