import type { Tables } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useLiveQuery } from '../../lib/useLiveQuery'

export type Coupon = Tables<'coupons'>
export type CouponLook = 'peche' | 'menthe' | 'beurre' | 'violet'

export const LOOKS: Record<CouponLook, string> = { peche: 'bg-peche', menthe: 'bg-menthe', beurre: 'bg-beurre', violet: 'bg-violet' }

export function useCoupons() {
  return useLiveQuery(['coupons'], () => supabase.from('coupons').select('*').order('created_at', { ascending: false }))
}
