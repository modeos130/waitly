'use client'

import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Download, ExternalLink, Save, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SignupChart = dynamic(() => import('@/components/signup-chart'), { ssr: false })

interface Page {
  id: string; slug: string; title: string; description: string; launch_date: string;
  bg_color: string; text_color: string; accent_color: string; template: string;
  show_count: boolean; custom_thank_you: string; is_active: boolean; created_at: string;
}
interface Subscriber {
  id: string; email: string; name: string; referral_code: string; referred_by: string;
  position: number; created_at: string;
}

export default function PageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [page, setPage] = useState<Page | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'settings' | 'subscribers'>('settings')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: p } = await supabase.from('pages').select('*').eq('id', params.id).single()
    if (p) setPage(p)
    const { data: subs } = await supabase.from('subscribers').select('*').eq('page_id', params.id).order('position', { ascending: true })
    if (subs) setSubscribers(subs)
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!page) return
    setSaving(true)
    const supabase = createClient()
    const { title, description, slug, launch_date, bg_color, text_color, accent_color, template, show_count, custom_thank_you, is_active } = page
    await supabase.from('pages').update({ title, description, slug, launch_date, bg_color, text_color, accent_color, template, show_count, custom_thank_you, is_active }).eq('id', page.id)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!page || !confirm('Delete this page and all subscribers?')) return
    const supabase = createClient()
    await supabase.from('pages').delete().eq('id', page.id)
    router.push('/dashboard')
  }

  const handleExport = () => {
    window.open(`/api/pages/${params.id}/export`, '_blank')
  }

  if (loading || !page) return <div className="text-gray-400">Loading...</div>

  const todaySubs = subscribers.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length
  const referralCount = subscribers.filter(s => s.referred_by).length
  const referralRate = subscribers.length > 0 ? Math.round((referralCount / subscribers.length) * 100) : 0

  // Chart data
  const chartData: { date: string; count: number }[] = []
  const dateMap = new Map<string, number>()
  subscribers.forEach(s => {
    const d = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dateMap.set(d, (dateMap.get(d) || 0) + 1)
  })
  dateMap.forEach((count, date) => chartData.push({ date, count }))

  const update = (key: string, value: string | boolean) => setPage(p => p ? { ...p, [key]: value } : p)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <a href={`/w/${page.slug}`} target="_blank" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              /w/{page.slug} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
          <div className="text-sm text-gray-400">Total Signups</div>
          <div className="text-3xl font-bold mt-1">{subscribers.length}</div>
        </div>
        <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
          <div className="text-sm text-gray-400">Today</div>
          <div className="text-3xl font-bold mt-1">{todaySubs}</div>
        </div>
        <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
          <div className="text-sm text-gray-400">Referral Rate</div>
          <div className="text-3xl font-bold mt-1">{referralRate}%</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mb-8 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Signups Over Time</h3>
          <SignupChart data={chartData} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['settings', 'subscribers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-violet-600/20 text-violet-400' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input type="text" value={page.title} onChange={e => update('title', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug</label>
            <input type="text" value={page.slug} onChange={e => update('slug', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={page.description || ''} onChange={e => update('description', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Template</label>
            <select value={page.template} onChange={e => update('template', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none">
              {['minimal', 'gradient', 'split', 'bold'].map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Background</label>
              <input type="color" value={page.bg_color} onChange={e => update('bg_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Text</label>
              <input type="color" value={page.text_color} onChange={e => update('text_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Accent</label>
              <input type="color" value={page.accent_color} onChange={e => update('accent_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={page.show_count} onChange={e => update('show_count', e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border-white/20" />
            <span className="text-sm">Show subscriber count</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={page.is_active} onChange={e => update('is_active', e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border-white/20" />
            <span className="text-sm">Page is active</span>
          </label>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" />{subscribers.length} subscribers</h3>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition">
              <Download className="w-4 h-4" />Export CSV
            </button>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Referral Code</th>
                  <th className="text-left px-4 py-3">Referred By</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-400">{s.position}</td>
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3 text-gray-400">{s.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-violet-400">{s.referral_code}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{s.referred_by || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
