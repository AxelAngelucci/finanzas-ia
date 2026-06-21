import { Ico } from './icons'
import { WA_LINK } from '@/lib/constants'

interface CTAButtonsProps {
  size?: 'sm'
  full?: boolean
}

export default function CTAButtons({ size, full }: CTAButtonsProps) {
  const cls = size === 'sm' ? 'btn btn-sm' : 'btn'
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: full ? 'center' : 'flex-start' }}>
      <a href={WA_LINK} target="_blank" rel="noopener" className={cls + ' btn-wa'}>
        {Ico.wa()} Empezá por WhatsApp
      </a>
      <a href="#descargar" className={cls + ' btn-app'}>
        {Ico.down()} Descargar la app
      </a>
    </div>
  )
}
