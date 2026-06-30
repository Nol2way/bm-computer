import { useEffect, useState } from 'react'
import { Icon } from './Icons'
import { cx } from '../lib/ui'

// ดูรูปเต็มจอ + ซูม (คลิกสลับ) + เลื่อนหลายภาพ (ลูกศร/ปุ่ม/คีย์บอร์ด)
export default function Lightbox({ images, index, setIndex, onClose }) {
  const [zoom, setZoom] = useState(false)
  const go = (d) => { setIndex((i) => (i + d + images.length) % images.length); setZoom(false) }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length])

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4 text-white/80">
        <span className="text-sm">{index + 1} / {images.length}</span>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 hover:text-white cursor-pointer" aria-label="close"><Icon name="x" size={24} /></button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {images.length > 1 && (
          <button onClick={() => go(-1)} className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer" aria-label="prev"><Icon name="chevronLeft" size={24} /></button>
        )}
        <img src={images[index]} alt="" onClick={() => setZoom((z) => !z)}
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800/1a1a1a/666?text=BM' }}
          className={cx('max-h-[72vh] max-w-full bg-white object-contain transition-transform duration-300',
            zoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in')} />
        {images.length > 1 && (
          <button onClick={() => go(1)} className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer" aria-label="next"><Icon name="chevronRight" size={24} /></button>
        )}
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto p-4">
        {images.map((src, i) => (
          <button key={i} onClick={() => { setIndex(i); setZoom(false) }}
            className={cx('h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition', i === index ? 'border-brand-500' : 'border-white/20 opacity-60 hover:opacity-100')}>
            <img src={src} alt="" className="h-full w-full bg-white object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}
