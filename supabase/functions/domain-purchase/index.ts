import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'DomainVault',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { domain_id, success_url, cancel_url } = await req.json();

    if (!domain_id || !success_url || !cancel_url) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    // Get domain details
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select(`
        *,
        seller:sellers(id, full_name, stripe_account_id, stripe_account_status)
      `)
      .eq('id', domain_id)
      .eq('is_for_sale', true)
      .eq('sale_status', 'available')
      .eq('verification_status', 'verified')
      .single();

    if (domainError || !domain) {
      return corsResponse({ error: 'Domain not found or not available for sale' }, 404);
    }

    // Check if buyer is not the seller
    if (domain.seller_id === user.id) {
      return corsResponse({ error: 'You cannot purchase your own domain' }, 400);
    }

    // Calculate fees
    const salePrice = domain.price;
    const marketplaceFee = Math.round(salePrice * 0.01 * 100); // 1% in cents
    const sellerAmount = salePrice * 100 - marketplaceFee; // Convert to cents

    // Get or create customer
    let customerId;
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!customer?.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });

      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    // Create payment intent with application fee for marketplace
    const paymentIntent = await stripe.paymentIntents.create({
      amount: salePrice * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      application_fee_amount: marketplaceFee,
      transfer_data: domain.seller.stripe_account_id ? {
        destination: domain.seller.stripe_account_id,
      } : undefined,
      metadata: {
        domain_id: domain.id,
        seller_id: domain.seller_id,
        buyer_id: user.id,
        marketplace_fee: marketplaceFee.toString(),
      },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: marketplaceFee,
        transfer_data: domain.seller.stripe_account_id ? {
          destination: domain.seller.stripe_account_id,
        } : undefined,
        metadata: {
          domain_id: domain.id,
          seller_id: domain.seller_id,
          buyer_id: user.id,
          marketplace_fee: marketplaceFee.toString(),
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Domain: ${domain.name}`,
              description: domain.description || `Premium domain ${domain.name}`,
            },
            unit_amount: salePrice * 100,
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        domain_id: domain.id,
        seller_id: domain.seller_id,
        buyer_id: user.id,
      },
    });

    // Create domain sale record
    const { error: saleError } = await supabase
      .from('domain_sales')
      .insert({
        domain_id: domain.id,
        seller_id: domain.seller_id,
        buyer_id: user.id,
        sale_price: salePrice,
        marketplace_fee: marketplaceFee / 100,
        seller_amount: sellerAmount / 100,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
      });

    if (saleError) {
      console.error('Error creating domain sale record:', saleError);
      return corsResponse({ error: 'Failed to create sale record' }, 500);
    }

    // Mark domain as pending sale
    await supabase
      .from('domains')
      .update({ sale_status: 'pending' })
      .eq('id', domain.id);

    console.log(`Created domain purchase session ${session.id} for domain ${domain.name}`);

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Domain purchase error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});