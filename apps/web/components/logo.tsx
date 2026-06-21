import Image from 'next/image'

export default function Logo() {
  return (
    <a href="#top" className="logo">
      <span className="logo-mark">
        <Image src="/logo.png" alt="Finia" width={34} height={34} priority />
      </span>
      Fin<span style={{ color: 'var(--primary)' }}>ia</span>
    </a>
  )
}
