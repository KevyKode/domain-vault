import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'DomainVault Integration',
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

    // Validate input parameters
    if (!domain_id || typeof domain_id !== 'string') {
      return corsResponse({ error: 'Missing or invalid domain_id' }, 400);
    }
    if (!success_url || typeof success_url !== 'string') {
      return corsResponse({ error: 'Missing or invalid success_url' }, 400);
    }
    if (!cancel_url || typeof cancel_url !== 'string') {
      return corsResponse({ error: 'Missing or invalid cancel_url' }, 400);
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Authentication failed or user not found' }, 401);
    }

    // Fetch domain details from Supabase
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('id, name, price, seller_id')
      .eq('id', domain_id)
      .eq('is_for_sale', true)
      .eq('sale_status', 'available')
      .maybeSingle();

    if (domainError || !domain) {
      console.error('Failed to fetch domain:', domainError?.message || 'Domain not found or not available for sale');
      return corsResponse({ error: 'Domain not found or not available for sale' }, 404);
    }

    // Fetch seller's Stripe Connect account ID
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('stripe_account_id, payout_enabled')
      .eq('id', domain.seller_id)
      .maybeSingle();

    if (sellerError || !seller || !seller.stripe_account_id || !seller.payout_enabled) {
      console.error('Seller Stripe account not found or not enabled for payouts:', sellerError?.message || 'Seller not configured for payouts');
      return corsResponse({ error: 'Seller not configured for payouts' }, 500);
    }

    // Calculate marketplace fee (1%) and seller amount
    const domainPriceCents = Math.round(domain.price * 100); // Convert to cents
    const marketplaceFeeCents = Math.round(domainPriceCents * 0.01); // 1% fee
    const sellerAmountCents = domainPriceCents - marketplaceFeeCents;

    // Ensure minimum Stripe application fee (50 cents for USD)
    const minimumApplicationFee = 50; // In cents
    const finalMarketplaceFeeCents = Math.max(marketplaceFeeCents, minimumApplicationFee);

    // Fetch or create Stripe customer
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId;
    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });
      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);
        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }
      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Assuming USD, adjust if multi-currency is needed
            product_data: {
              name: domain.name,
              description: `Purchase of ${domain.name} from DomainVault Marketplace`,
            },
            unit_amount: domainPriceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      payment_intent_data: {
        application_fee_amount: finalMarketplaceFeeCents, // Our 1% fee
        transfer_data: {
          destination: seller.stripe_account_id, // Transfer remaining amount to seller
        },
        metadata: {
          domain_id: domain.id,
          seller_id: domain.seller_id,
          buyer_id: user.id,
          marketplace_fee: finalMarketplaceFeeCents,
          seller_amount: sellerAmountCents,
          domain_price: domainPriceCents,
        },
      },
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);
    return corsResponse({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});

// No longer needed as parameters are explicitly validated
// type ExpectedType = 'string' | { values: string[] };
// type Expectations<T> = { [K in keyof T]: ExpectedType };
// function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
//   for (const parameter in values) {
//     const expectation = expected[parameter];
//     const value = values[parameter];
//     if (expectation === 'string') {
//       if (value == null) {
//         return `Missing required parameter ${parameter}`;
//       }
//       if (typeof value !== 'string') {
//         return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
//       }
//     } else {
//       if (!expectation.values.includes(value)) {
//         return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
//       }
//     }
//   }
//   return undefined;
// }