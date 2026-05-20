const COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
]

function colorForName(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface Props {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = { sm: 'size-8 text-xs', md: 'size-9 text-sm', lg: 'size-12 text-base' }

export function PatientAvatar({ firstName, lastName, size = 'md' }: Props) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const color = colorForName(firstName + lastName)
  return (
    <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
      {initials}
    </div>
  )
}
