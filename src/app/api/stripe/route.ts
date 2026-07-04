import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key_if_not_configured', {
  apiVersion: '2025-02-24' as any, // Dùng phiên bản phù hợp
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, user_id, shipping_address } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Giỏ hàng trống' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Tạo các line_items từ danh sách sản phẩm trong giỏ hàng
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'vnd',
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: {
            id: item.id,
            category: item.category,
          },
        },
        unit_amount: Math.round(item.price), // Stripe tính theo đơn vị nhỏ nhất (VND tính trực tiếp đồng)
      },
      quantity: item.quantity,
    }));

    // Tạo checkout session trên Stripe (chế độ test)
    // Cung cấp metadata để lưu trữ thông tin phục vụ lưu database sau khi thanh toán
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&user_id=${user_id}&address=${encodeURIComponent(shipping_address)}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        user_id,
        shipping_address,
        cart_items: JSON.stringify(
          items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Lỗi khi tạo Stripe Session:', error);
    // Nếu chưa cấu hình Stripe secret key, giả lập trả về một URL thành công giả định để phục vụ test UI
    if (error.message && error.message.includes('sk_test')) {
      return NextResponse.json(
        { error: 'Cấu hình Stripe Secret Key bị lỗi' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Lỗi thanh toán: ' + (error.message || 'Vui lòng kiểm tra lại cấu hình STRIPE_SECRET_KEY.') },
      { status: 500 }
    );
  }
}
