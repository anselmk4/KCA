/**
 * Helper utility to manage order status transitions and increment coupon uses.
 */
export async function incrementCouponUses(orderId: string, supabaseAdmin: any) {
  try {
    // 1. Fetch order details to check if there is an associated coupon
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('coupon_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) {
      console.error('[incrementCouponUses] Error fetching order:', orderErr.message);
      return;
    }

    if (!order || !order.coupon_id) {
      // No coupon used for this order
      return;
    }

    console.log(`[incrementCouponUses] Order ${orderId} completed using Coupon ${order.coupon_id}. Incrementing uses...`);

    // 2. Fetch current uses
    const { data: coupon, error: couponErr } = await supabaseAdmin
      .from('coupons')
      .select('current_uses')
      .eq('id', order.coupon_id)
      .maybeSingle();

    if (couponErr) {
      console.error('[incrementCouponUses] Error fetching coupon:', couponErr.message);
      return;
    }

    const currentUses = coupon?.current_uses || 0;
    const newUses = currentUses + 1;

    // 3. Update current_uses
    const { error: updateErr } = await supabaseAdmin
      .from('coupons')
      .update({
        current_uses: newUses,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', order.coupon_id);

    if (updateErr) {
      console.error('[incrementCouponUses] Error updating coupon uses:', updateErr.message);
    } else {
      console.log(`[incrementCouponUses] Coupon ${order.coupon_id} uses updated from ${currentUses} to ${newUses}.`);
    }
  } catch (err) {
    console.error('[incrementCouponUses] Unexpected error:', err);
  }
}
