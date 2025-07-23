import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;\nconst stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'DomainVault',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  // Handle domain purchase completion
  if (event.type === 'checkout.session.completed') {
    const session = stripeData as Stripe.Checkout.Session;

    if (session.metadata?.domain_id) {
      await handleDomainPurchaseCompleted(session);
      return;
    }
  }

  // Handle payment intent succeeded for domain purchases
  // This event is crucial for initiating payouts via transfer_data
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = stripeData as Stripe.PaymentIntent;

    if (paymentIntent.metadata?.domain_id) {
      await handleDomainPaymentSucceeded(paymentIntent);
      return;
    }
  }

  // Handle regular subscription/product purchases (existing logic)
  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;
      isSubscription = mode === 'subscription';
      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

async function handleDomainPurchaseCompleted(session: Stripe.Checkout.Session) {
  try {
    const { domain_id, seller_id, buyer_id, marketplace_fee, seller_amount, domain_price } = session.metadata!;

    console.log(`Processing domain purchase completion for domain ${domain_id}`);

    // Update domain sale status in 'domains' table
    const { error: domainUpdateError } = await supabase
      .from('domains')
      .update({
        sale_status: 'pending', // Mark as pending until payout is confirmed
        sold_at: new Date().toISOString(),
        buyer_id: buyer_id,
        is_for_sale: false, // No longer for sale
        is_visible: false, // Hide from marketplace
        // verification_status: 'unverified', // New owner must re-verify - handled by separate process
        // verification_id: null,
        // last_ownership_check: null
      })
      .eq('id', domain_id);

    if (domainUpdateError) {
      console.error('Error updating domain status:', domainUpdateError);
      return;
    }

    // Create domain_sales record
    const { error: saleInsertError } = await supabase
      .from('domain_sales')
      .insert({
        domain_id: domain_id,
        seller_id: seller_id,
        buyer_id: buyer_id,
        sale_price: parseFloat(domain_price) / 100, // Convert cents back to dollars
        marketplace_fee: parseFloat(marketplace_fee) / 100,
        seller_amount: parseFloat(seller_amount) / 100,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending', // Pending until payout is confirmed
        created_at: new Date().toISOString(),
      });

    if (saleInsertError) {
      console.error('Error inserting domain sale record:', saleInsertError);
      return;
    }

    // Create marketplace transaction record for the full sale amount
    const { error: transactionError } = await supabase
      .from('marketplace_transactions')
      .insert({
        transaction_type: 'domain_sale',
        domain_sale_id: domain_id, // Link to domain_sales
        user_id: buyer_id,
        amount: session.amount_total! / 100,
        currency: session.currency!,
        stripe_transaction_id: session.payment_intent as string,
        description: `Domain purchase: ${session.metadata?.name || domain_id}`,
        status: 'completed', // The payment itself is completed
        processed_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('Error creating transaction record for domain sale:', transactionError);
    }

    console.log(`Successfully processed domain purchase completion for domain ${domain_id}`);
  } catch (error) {
    console.error('Error handling domain purchase completion:', error);
  }
}

async function handleDomainPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { domain_id, seller_id, buyer_id, marketplace_fee, seller_amount } = paymentIntent.metadata!;

    console.log(`Processing payment success for domain ${domain_id} and initiating payout.`);

    // Fetch seller's Stripe Connect account ID
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('stripe_account_id')
      .eq('id', seller_id)
      .maybeSingle();

    if (sellerError || !seller || !seller.stripe_account_id) {
      console.error('Seller Stripe account not found for payout:', sellerError?.message || 'Seller Stripe account missing');
      // Log this error but don't block the webhook, manual intervention might be needed
      return;
    }

    // Create Stripe Transfer to seller's connected account
    const transfer = await stripe.transfers.create({
      amount: parseInt(seller_amount), // Amount to transfer to seller in cents
      currency: paymentIntent.currency,
      destination: seller.stripe_account_id,
      transfer_group: `domain_sale_${domain_id}`, // Group related transfers
      metadata: {
        domain_id: domain_id,
        seller_id: seller_id,
        buyer_id: buyer_id,
        original_payment_intent_id: paymentIntent.id,
      },
    });

    console.log(`Stripe Transfer created: ${transfer.id} for domain ${domain_id}`);

    // Update domain_sales record with transfer ID and status
    const { error: updateSaleError } = await supabase
      .from('domain_sales')
      .update({
        stripe_transfer_id: transfer.id,
        status: 'completed', // Mark sale as completed after successful transfer initiation
        completed_at: new Date().toISOString(),
      })
      .eq('domain_id', domain_id)
      .eq('buyer_id', buyer_id)
      .eq('status', 'pending'); // Only update if still pending

    if (updateSaleError) {
      console.error('Error updating domain sale with transfer ID:', updateSaleError);
    }

    // Create marketplace transaction record for the marketplace fee
    const { error: feeTransactionError } = await supabase
      .from('marketplace_transactions')
      .insert({
        transaction_type: 'marketplace_fee',
        domain_sale_id: domain_id,
        user_id: buyer_id, // Buyer is the one who paid the fee indirectly
        amount: parseInt(marketplace_fee) / 100,
        currency: paymentIntent.currency,
        stripe_transaction_id: paymentIntent.id,
        description: `Marketplace fee for domain ${domain_id}`,
        status: 'completed',
        processed_at: new Date().toISOString(),
      });

    if (feeTransactionError) {
      console.error('Error creating marketplace fee transaction:', feeTransactionError);
    }

    // Create seller_payouts record
    const { error: payoutInsertError } = await supabase
      .from('seller_payouts')
      .insert({
        seller_id: seller_id,
        domain_sale_id: domain_id,
        amount: parseInt(seller_amount) / 100,
        stripe_transfer_id: transfer.id,
        status: 'completed', // Transfer initiated successfully
        processed_at: new Date().toISOString(),
      });

    if (payoutInsertError) {
      console.error('Error inserting seller payout record:', payoutInsertError);
    }

    // Finally, update the domain's sale_status to 'sold'
    const { error: domainSoldError } = await supabase
      .from('domains')
      .update({
        sale_status: 'sold',
      })
      .eq('id', domain_id)
      .eq('sale_status', 'pending'); // Only update if still pending

    if (domainSoldError) {
      console.error('Error updating domain sale_status to sold:', domainSoldError);
    }

    console.log(`Successfully processed payment and initiated payout for domain ${domain_id}`);
  } catch (error) {
    console.error('Error handling domain payment success and payout:', error);
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}