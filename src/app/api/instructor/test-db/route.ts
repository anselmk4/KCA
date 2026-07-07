import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    // Count profiles
    const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    // Count courses
    const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    
    // Count payments
    const { count: paymentsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });

    // Count order_items
    const { count: orderItemsCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });

    // Count enrollments
    const { count: enrollmentsCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      currentUser: user ? { id: user.id, email: user.email } : null,
      profilesCount,
      coursesCount,
      paymentsCount,
      orderItemsCount,
      enrollmentsCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
