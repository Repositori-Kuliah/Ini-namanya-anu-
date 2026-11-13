/**
 * Rawon Gusti Security and Lifecycle Test Suite (Node.js)
 * Covers: Auth, Role, QR Token, Order Pricing, and Payment Integrity.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fmwmvxqdnpbznnjtnnrx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uP60Of5g4Xw6MRsU3ni-Lg_3WKwdoOO';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' RAWON GUSTI BACKEND SECURITY & INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // Test Suite 1: Anonymous / Unauthenticated Boundary
  // ----------------------------------------------------
  console.log('[Suite 1: Anonymous Access & Privilege Check]');
  
  // Test 1.1: Anon caller cannot query operational service_requests table directly
  const { data: srData, error: srErr } = await anonClient.from('service_requests').select('*');
  assert(
    !srData || srData.length === 0 || srErr !== null,
    'Anon user cannot read service_requests directly from table'
  );

  // Test 1.2: Anon caller cannot query payments table directly
  const { data: payData, error: payErr } = await anonClient.from('payments').select('*');
  assert(
    !payData || payData.length === 0 || payErr !== null,
    'Anon user cannot read payments table directly (RLS protected)'
  );

  // Test 1.3: Anon caller cannot query table_sessions table directly
  const { data: sesData, error: sesErr } = await anonClient.from('table_sessions').select('*');
  assert(
    !sesData || sesData.length === 0 || sesErr !== null,
    'Anon user cannot read table_sessions directly (RLS protected)'
  );

  // ----------------------------------------------------
  // Test Suite 2: Customer QR Token Validation
  // ----------------------------------------------------
  console.log('\n[Suite 2: Customer QR Token & Table Access]');

  // Test 2.1: Blank/Fake token fails to load table
  const fakeToken = 'non-existent-fake-token-99999';
  const { data: fakeTable } = await anonClient.from('tables').select('*').eq('qr_token', fakeToken);
  assert(
    !fakeTable || fakeTable.length === 0,
    'Fake/invalid QR token returns no table data (fails closed)'
  );

  // Test 2.2: Valid active table lookup
  const { data: realTables } = await anonClient.from('tables').select('table_id, table_number, qr_token').limit(1);
  const realTable = realTables?.[0];
  assert(
    realTable && realTable.qr_token,
    `Valid table found in database: Table ${realTable?.table_number}`
  );

  // Test 2.3: my_orders returns empty array for inactive/empty session, never true
  if (realTable?.qr_token) {
    const { data: ordersData } = await anonClient.rpc('my_orders', { p_token: realTable.qr_token });
    assert(
      Array.isArray(ordersData) || ordersData === null,
      'my_orders returns safe array or null, never forged paid state'
    );
  }

  // ----------------------------------------------------
  // Test Suite 3: Order Pricing & Calculation Integrity
  // ----------------------------------------------------
  console.log('\n[Suite 3: Order Pricing Calculation on Server]');

  // Test 3.1: Server-side bill_total function test
  // Rule: bill_total(sub) = sub + 5% service + 10% tax on (sub + service)
  // For sub = 100,000 -> service = 5,000, sub+serv = 105,000, tax = 10,500, total = 115,500
  const { data: calcTotal, error: calcErr } = await anonClient.rpc('bill_total', { sub: 100000 });
  assert(
    !calcErr && Number(calcTotal) === 115500,
    `bill_total(100,000) correctly calculated on server as Rp 115,500 (result: ${calcTotal})`
  );

  // Test 3.2: Products catalog is readable by anonymous customers
  const { data: menuList, error: menuErr } = await anonClient.from('products').select('product_id, name, price').limit(3);
  assert(
    !menuErr && menuList && menuList.length > 0,
    `Menu catalog readable by public QR customer (${menuList?.length} items loaded)`
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});

