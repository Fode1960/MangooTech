import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { packId, successUrl, cancelUrl } = await req.json()

    // Simuler la génération d'URLs comme dans la vraie fonction
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3001'
    
    const generatedSuccessUrl = successUrl || `${frontendUrl}/dashboard?payment=success&pack=${packId}`
    const generatedCancelUrl = cancelUrl || `${frontendUrl}/dashboard?payment=cancelled`
    
    console.log('🔧 FRONTEND_URL from env:', Deno.env.get('FRONTEND_URL'))
    console.log('🔧 Generated success URL:', generatedSuccessUrl)
    console.log('🔧 Generated cancel URL:', generatedCancelUrl)
    
    return new Response(
      JSON.stringify({ 
        frontendUrl,
        successUrl: generatedSuccessUrl,
        cancelUrl: generatedCancelUrl,
        testUrl: 'https://checkout.stripe.com/test-session'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})