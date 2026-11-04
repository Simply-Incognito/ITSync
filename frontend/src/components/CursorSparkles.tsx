import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent as ReactAnimationEvent, CSSProperties } from 'react'

type Sparkle = {
  id: number
  x: number
  y: number
  size: number
  rotation: number
}

function isVisibleSurface(target: EventTarget | null) {
  if (!(target instanceof Element)) return false

  let element: Element | null = target
  while (element) {
    const color = window.getComputedStyle(element).backgroundColor
    const match = color.match(/rgba?\(([^)]+)\)/)
    if (match) {
      const channels = match[1].split(/[,/ ]+/).filter(Boolean).map(Number)
      const alpha = channels.length > 3 ? channels[3] : 1
      if (alpha > 0.05) {
        return true
      }
    }
    element = element.parentElement
  }

  return false
}

export default function CursorSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const nextId = useRef(0)
  const lastCreated = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !isVisibleSurface(event.target)) return

      const now = performance.now()
      if (now - lastCreated.current < 90) return
      lastCreated.current = now

      const id = nextId.current++
      const offset = () => Math.random() * 18 - 9
      setSparkles((current) => [
        ...current.slice(-16),
        {
          id,
          x: event.clientX + offset(),
          y: event.clientY + offset(),
          size: 7 + Math.random() * 5,
          rotation: Math.random() * 90,
        },
      ])
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  function removeSparkle(event: ReactAnimationEvent<HTMLSpanElement>) {
    const id = Number(event.currentTarget.dataset.sparkleId)
    setSparkles((current) => current.filter((sparkle) => sparkle.id !== id))
  }

  return (
    <div className="cursor-sparkles" aria-hidden="true">
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          data-sparkle-id={sparkle.id}
          className="cursor-sparkle"
          onAnimationEnd={removeSparkle}
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            '--sparkle-rotation': `${sparkle.rotation}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
