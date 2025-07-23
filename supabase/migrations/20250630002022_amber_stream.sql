/*
  # Remove all fake domains from database

  1. Delete fake domains
    - Remove ecommercepro.com
    - Remove financeexpert.com  
    - Remove healthplus.com
    - Remove techstartup.com
  
  2. Clean up any related data
    - Remove associated inquiries
    - Remove verification records
*/

-- Delete fake domains and all related data
DELETE FROM inquiries WHERE domain_id IN (
  SELECT id FROM domains WHERE name IN (
    'ecommercepro.com',
    'financeexpert.com', 
    'healthplus.com',
    'techstartup.com'
  )
);

DELETE FROM domain_verifications WHERE domain_name IN (
  'ecommercepro.com',
  'financeexpert.com',
  'healthplus.com', 
  'techstartup.com'
);

DELETE FROM verification_tokens WHERE domain_name IN (
  'ecommercepro.com',
  'financeexpert.com',
  'healthplus.com',
  'techstartup.com'
);

DELETE FROM domains WHERE name IN (
  'ecommercepro.com',
  'financeexpert.com',
  'healthplus.com', 
  'techstartup.com'
);

-- Also remove any test sellers that might have been created for fake domains
DELETE FROM sellers WHERE email LIKE '%fake%' OR email LIKE '%test%' OR email LIKE '%demo%';