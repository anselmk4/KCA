const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  const studentId = '3ff3a5fc-e383-49b8-9788-e4c3a2a2dfcf';
  const courseId = '53fa61ed-477b-4579-abf3-6387974b0b13';

  // Let's find orders/payments for this student and this course
  // First, let's find the orders of this student
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', studentId);
  console.log('Orders for student:', orders);

  // If there are orders, let's look at order items
  const orderIds = orders?.map(o => o.id) || [];
  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase.from('order_items').select('*').in('order_id', orderIds);
    console.log('Order items for student orders:', orderItems);
  }

  // Let's also check payments for these orders
  if (orderIds.length > 0) {
    const { data: payments } = await supabase.from('payments').select('*').in('order_id', orderIds);
    console.log('Payments for student orders:', payments);
  }

  // What about user_id in payments table? Let's check payments directly by user_id
  const { data: directPayments } = await supabase.from('payments').select('*').eq('user_id', studentId);
  console.log('Direct payments for user_id:', directPayments);
}

main();
