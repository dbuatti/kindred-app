// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { action, targetEmail, targetUserId } = await req.json()
    console.log(`[admin-tasks] Action: ${action} for ${targetEmail || targetUserId}`);

    if (action === 'resend-magic-link') {
      if (!targetEmail) throw new Error('Target email is required')
      
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: targetEmail,
        options: {
          emailRedirectTo: 'https://bcchduauwyyymvthxgkf.supabase.co/auth/confirm',
        },
      })
      
      if (error) throw error
      return new Response(JSON.stringify({ message: 'Magic link sent' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'delete-user') {
      if (!targetUserId) throw new Error('Target user ID is required')
      
      const { error } = await supabaseClient.auth.admin.deleteUser(targetUserId)
      if (error) throw error
      
      return new Response(JSON.stringify({ message: 'User deleted' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    console.error("[admin-tasks] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})