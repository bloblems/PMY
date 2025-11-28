import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Received webhook event:', event.type);

    // Handle identity verification events
    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id;

      if (userId) {
        // Update verification record
        await supabase
          .from('account_verifications')
          .update({
            status: 'verified',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            verified_data: JSON.stringify({
              verified_outputs: session.verified_outputs,
            }),
          })
          .eq('session_id', session.id);

        // Update user profile
        await supabase
          .from('user_profiles')
          .update({
            is_verified: 'true',
            verification_provider: 'stripe_identity',
            verified_at: new Date().toISOString(),
            verification_level: 'identity',
          })
          .eq('id', userId);

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'verification_complete',
            title: 'Identity Verified!',
            message: 'Your identity has been successfully verified. You now have a verified badge on your profile.',
            is_read: 'false',
          });

        console.log('User verified:', userId);
      }
    }

    if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      
      await supabase
        .from('account_verifications')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', session.id);
    }

    if (event.type === 'identity.verification_session.canceled') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id;

      await supabase
        .from('account_verifications')
        .update({
          status: 'failed',
          failure_reason: 'Verification was canceled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', session.id);

      if (userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'verification_failed',
            title: 'Verification Canceled',
            message: 'Your identity verification was canceled. You can try again from your profile settings.',
            is_read: 'false',
          });
      }
    }

    // Handle payment events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      if (paymentIntent.metadata?.type === 'identity_verification') {
        await supabase
          .from('account_verifications')
          .update({
            payment_status: 'succeeded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log('Payment succeeded for verification:', paymentIntent.id);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      if (paymentIntent.metadata?.type === 'identity_verification') {
        const userId = paymentIntent.metadata?.user_id;

        await supabase
          .from('account_verifications')
          .update({
            payment_status: 'failed',
            status: 'failed',
            failure_reason: 'Payment failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (userId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'verification_failed',
              title: 'Payment Failed',
              message: 'Your payment for identity verification failed. Please try again.',
              is_read: 'false',
            });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

