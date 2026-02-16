import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's caption analytics if they have any
  const { data: userCaptions } = await supabase
    .from('captions')
    .select(`
      id,
      content,
      like_count,
      created_datetime_utc,
      humor_flavor_id,
      humor_flavors!left(slug, description)
    `)
    .eq('profile_id', user.id)
    .order('created_datetime_utc', { ascending: false })
    .limit(10)

  const { data: userLikes } = await supabase
    .from('caption_likes')
    .select('id')
    .eq('profile_id', user.id)

  const userStats = {
    totalCaptions: userCaptions?.length || 0,
    totalLikes: userCaptions?.reduce((sum, caption) => sum + (caption.like_count || 0), 0) || 0,
    likesGiven: userLikes?.length || 0,
    joinedDate: user.created_at
  }

  return (
    <DashboardClient
      user={user}
      userCaptions={userCaptions || []}
      userStats={userStats}
    />
  )
}