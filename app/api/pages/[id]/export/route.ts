import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: page } = await supabase.from('pages').select('id').eq('id', params.id).eq('user_id', user.id).single()
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: subscribers } = await supabase.from('subscribers').select('*').eq('page_id', params.id).order('position', { ascending: true })

  const headers = ['Position', 'Email', 'Name', 'Referral Code', 'Referred By', 'Date']
  const rows = (subscribers || []).map(s => [s.position, s.email, s.name || '', s.referral_code, s.referred_by || '', new Date(s.created_at).toISOString()])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="subscribers-${params.id}.csv"`,
    },
  })
}
