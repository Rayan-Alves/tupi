import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useLibrary() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    if (data) setBooks(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  async function addBook(book) {
    const { data } = await supabase
      .from('books')
      .insert({ user_id: user.id, ...book })
      .select().single()
    if (data) setBooks(prev => [data, ...prev])
    return data
  }

  async function updateBook(id, changes) {
    const finishedTransition =
      changes.status === 'finished' && books.find(b => b.id === id)?.status !== 'finished'
    const payload = {
      ...changes,
      updated_at: new Date().toISOString(),
      ...(finishedTransition ? { finished_at: new Date().toISOString() } : {}),
    }
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b))
    await supabase.from('books').update(payload).eq('id', id).eq('user_id', user.id)
  }

  async function deleteBook(id) {
    setBooks(prev => prev.filter(b => b.id !== id))
    await supabase.from('books').delete().eq('id', id).eq('user_id', user.id)
  }

  return { books, loading, refresh, addBook, updateBook, deleteBook }
}

/* ─── Open Library search ─────────────────── */

export async function searchOpenLibrary(query, signal) {
  if (!query || query.trim().length < 2) return []
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = await res.json()
  return (data.docs || []).map(d => ({
    external_id: d.key,
    title:       d.title,
    author:      (d.author_name || []).slice(0, 2).join(', ') || null,
    year:        d.first_publish_year || null,
    total_pages: d.number_of_pages_median || null,
    cover_url:   d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
  }))
}
