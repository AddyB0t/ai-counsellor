import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('Auth callback received:', { code: !!code, error, errorDescription })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin))
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Exchange code for session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Session exchange:', { user: data?.user?.email, error: sessionError?.message })

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, requestUrl.origin))
    }

    if (data.user) {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', data.user.id)
        .single()

      console.log('Profile check:', { existingProfile, error: profileError?.message })

      // Create profile if it doesn't exist (new Google user)
      if (!existingProfile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          onboarding_completed: false,
          current_stage: 1,
        })

        console.log('Profile insert:', { error: insertError?.message })

        if (insertError) {
          console.error('Failed to create profile:', insertError)
        }

        // Redirect to onboarding for new users
        console.log('Redirecting new user to onboarding')
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      if (!existingProfile.onboarding_completed) {
        console.log('Redirecting to onboarding (incomplete)')
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      // Redirect to dashboard for returning users
      console.log('Redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }
  }

  // Redirect to login on error
  console.log('No code or user, redirecting to login')
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
