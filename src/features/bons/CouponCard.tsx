import type { ReactNode } from 'react'
import { LOOKS, type Coupon, type CouponLook } from './hooks'

/** Le bon, façon ticket : encoches sur les côtés, bord pointillé. */
export function CouponCard({ coupon, from, children, dimmed = false }: { coupon: Pick<Coupon, 'title' | 'details' | 'look'>; from: string; children?: ReactNode; dimmed?: boolean }) {
  return (
    <div className={`relative rounded-[22px] p-1.5 ${LOOKS[coupon.look as CouponLook]} ${dimmed ? 'opacity-60' : ''}`}>
      {/* encoches de ticket */}
      <span aria-hidden="true" className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-lilas" />
      <span aria-hidden="true" className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-lilas" />
      <div className="flex min-h-36 flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed border-prune/25 px-6 py-4 text-center">
        <span className="text-sm font-semibold tracking-wide text-prune/70">Bon pour</span>
        <span className="text-2xl leading-tight font-bold">{coupon.title}</span>
        {coupon.details && <span className="leading-snug">{coupon.details}</span>}
        <span className="text-sm text-prune/70">De la part de {from}</span>
        {children}
      </div>
    </div>
  )
}
