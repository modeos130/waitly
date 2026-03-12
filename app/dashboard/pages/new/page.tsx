'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const templates = ['minimal', 'gradient', 'split', 'bold'] as const

const templateStyles: Record<string, { bg: string; desc: string }> = {
  minimal: { bg: 'bg-gray-900', desc: 'Clean & dark' },
  gradient: { bg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400', desc: 'Animated vibes' },
  split: { bg: 'bg-gradient-to-br from-indigo-900 to-slate-900', desc: 'Image + form' },
  bold: { bg: 'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500', desc: 'Loud & punchy' },
}

export default function NewPagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', slug: '', launch_date: '',
    bg_color: '#000000', text_color: '#ffffff', accent_color: '#6366f1',
    template: 'minimal' as string, show_count: true, custom_thank_you: '',
  })

  const updateForm = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const payload = {
      user_id: user.id, title: form.title, slug: form.slug, description: form.description || null,
      bg_color: form.bg_color, text_color: form.text_color, accent_color: form.accent_color,
      template: form.template, show_count: form.show_count, custom_thank_you: form.custom_thank_you || null,
      launch_date: form.launch_date ? new Date(form.launch_date).toISOString() : null,
    }

    const { data, error: err } = await supabase.from('pages').insert(payload).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/pages/${data.id}`)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-8">Create New Page</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} required
              placeholder="My Awesome Product" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug * <span className="text-gray-500">(yoursite.com/w/slug)</span></label>
            <input type="text" value={form.slug} onChange={e => updateForm('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required
              placeholder="my-product" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={3}
              placeholder="Be the first to know when we launch..." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Launch Date</label>
            <input type="datetime-local" value={form.launch_date} onChange={e => updateForm('launch_date', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Template</label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(t => (
                <button key={t} type="button" onClick={() => updateForm('template', t)}
                  className={`p-3 rounded-xl border transition text-left ${form.template === t ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/20'}`}>
                  <div className={`h-16 rounded-lg mb-2 ${templateStyles[t].bg}`} />
                  <div className="text-sm font-medium capitalize">{t}</div>
                  <div className="text-xs text-gray-400">{templateStyles[t].desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Background</label>
              <input type="color" value={form.bg_color} onChange={e => updateForm('bg_color', e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Text</label>
              <input type="color" value={form.text_color} onChange={e => updateForm('text_color', e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Accent</label>
              <input type="color" value={form.accent_color} onChange={e => updateForm('accent_color', e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.show_count} onChange={e => updateForm('show_count', e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border-white/20 text-violet-600 focus:ring-violet-500" />
            <span className="text-sm">Show subscriber count publicly</span>
          </label>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Custom Thank You Message</label>
            <input type="text" value={form.custom_thank_you} onChange={e => updateForm('custom_thank_you', e.target.value)}
              placeholder="Thanks for joining! We'll be in touch." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-violet-500 focus:outline-none" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Page'}
          </button>
        </form>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold mb-4 text-gray-400">Live Preview</h2>
        <div className="rounded-2xl overflow-hidden border border-white/10 h-[600px]" style={{ backgroundColor: form.bg_color, color: form.text_color }}>
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <h3 className="text-2xl font-bold mb-3">{form.title || 'Your Title'}</h3>
              <p className="text-sm opacity-70 mb-6">{form.description || 'Your description will appear here...'}</p>
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-lg border opacity-30" style={{ borderColor: form.accent_color }} />
                <div className="h-10 px-6 rounded-lg flex items-center text-sm font-medium text-white" style={{ backgroundColor: form.accent_color }}>
                  Join
                </div>
              </div>
              {form.show_count && <p className="text-xs opacity-50 mt-3">42 people on the waitlist</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
