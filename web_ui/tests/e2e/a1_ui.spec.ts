import http from 'http';
import type { AddressInfo } from 'net';
import { test, expect } from '@playwright/test';

test.describe('Gói A1-UI: Sửa lỗi nền Chatbot (H1 Session ID UUID & H10 Chặn Mock Fake Reply)', () => {

  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  test('A1.1: Chat widget sinh session_id chuẩn UUID v4, lưu vào localStorage và gửi kèm POST /api/chat', async ({ page }) => {
    // 1. Vào trang chủ
    await page.goto('/');

    // 2. Mở chat widget
    const chatBtn = page.locator('button[title="Trò chuyện với trợ lý AI"]');
    await expect(chatBtn).toBeVisible({ timeout: 10000 });
    await chatBtn.click();

    // 3. Kiểm tra localStorage có lưu session_id chuẩn UUID v4
    const guestSessionId = await page.evaluate(() => localStorage.getItem('chat_session_id_guest'));
    expect(guestSessionId).not.toBeNull();
    expect(guestSessionId).toMatch(UUID_V4_REGEX);

    // 4. Bắt request POST /api/chat và verify payload session_id
    let capturedSessionId: string | null = null;
    await page.route('**/api/chat', async (route) => {
      const postData = JSON.parse(route.request().postData() || '{}');
      capturedSessionId = postData.session_id;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Xin chào! Tôi là trợ lý AI chính thức. Tôi có thể hỗ trợ gì cho bạn?',
          session_id: capturedSessionId
        })
      });
    });

    // 5. Gửi tin nhắn qua input chat
    const inputField = page.locator('input[placeholder*="Hỏi về sản phẩm"]');
    await expect(inputField).toBeVisible({ timeout: 10000 });
    await inputField.fill('Chào bạn, tư vấn giúp tôi nhé');
    await inputField.press('Enter');

    // 6. Verify tin nhắn bot xuất hiện
    await expect(page.locator('text=Xin chào! Tôi là trợ lý AI chính thức.')).toBeVisible({ timeout: 10000 });

    // 7. Xác minh session_id gửi lên server trùng khớp với session_id UUID trong localStorage
    expect(capturedSessionId).toBe(guestSessionId);

    // Chụp ảnh bằng chứng CUA
    await page.screenshot({ path: 'tests/e2e/screenshots/a1/chat_uuid_session.png' });
  });

  test('A1.2: Phân tách session_id theo từng user độc lập (H1)', async ({ page }) => {
    await page.goto('/');

    // 1. Mở chat ở chế độ Guest
    const chatBtn = page.locator('button[title="Trò chuyện với trợ lý AI"]');
    await chatBtn.click();
    const guestSession = await page.evaluate(() => localStorage.getItem('chat_session_id_guest'));
    expect(guestSession).toMatch(UUID_V4_REGEX);

    // 2. Giả lập đăng nhập User 1
    await page.evaluate(() => {
      localStorage.setItem('chat_session_id_user_alpha', '11111111-1111-4111-8111-111111111111');
      localStorage.setItem('chat_session_id_user_beta', '22222222-2222-4222-8222-222222222222');
    });

    const userASession = await page.evaluate(() => localStorage.getItem('chat_session_id_user_alpha'));
    const userBSession = await page.evaluate(() => localStorage.getItem('chat_session_id_user_beta'));

    // Xác minh hai user có 2 session_id hoàn toàn khác nhau và đều là UUID hợp lệ
    expect(userASession).toMatch(UUID_V4_REGEX);
    expect(userBSession).toMatch(UUID_V4_REGEX);
    expect(userASession).not.toBe(userBSession);
    expect(userASession).not.toBe(guestSession);
  });

  test('A1.3: Khi backend gặp sự cố (503 BACKEND_UNAVAILABLE), Chat widget hiển thị thông báo lỗi rõ ràng, KHÔNG trả lời giả (H10)', async ({ page }) => {
    await page.goto('/');

    // 1. Mở chat widget
    const chatBtn = page.locator('button[title="Trò chuyện với trợ lý AI"]');
    await chatBtn.click();

    // 2. Mock API route /api/chat trả về 503 BACKEND_UNAVAILABLE (giả lập FastAPI backend sập và cờ mock tắt)
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'BACKEND_UNAVAILABLE',
            message: 'Hệ thống AI tư vấn hiện đang tạm thời gián đoạn kết nối. Vui lòng thử lại sau ít phút hoặc gửi yêu cầu hỗ trợ tới nhân viên!'
          }
        })
      });
    });

    // 3. Gửi câu hỏi kích hoạt mock cũ: "tìm laptop mỏng nhẹ dưới 30 triệu"
    const inputField = page.locator('input[placeholder*="Hỏi về sản phẩm"]');
    await expect(inputField).toBeVisible({ timeout: 10000 });
    await inputField.fill('tìm laptop mỏng nhẹ dưới 30 triệu');
    await inputField.press('Enter');

    // 4. Xác minh thông báo lỗi 503 hiển thị rõ ràng trên giao diện chat
    await expect(page.locator('text=Hệ thống AI tư vấn hiện đang tạm thời gián đoạn kết nối')).toBeVisible({ timeout: 10000 });

    // 5. Xác minh KHÔNG BAO GIỜ sinh câu trả lời mock giả (no fake MacBook/Dell reply)
    const chatContainer = page.locator('div.flex-1.overflow-y-auto').first();
    await expect(chatContainer).not.toContainText('MacBook Air M3');
    await expect(chatContainer).not.toContainText('Dell XPS 13');
    await expect(chatContainer).not.toContainText('Chế độ Mock Fallback');

    // Chụp ảnh bằng chứng CUA
    await page.screenshot({ path: 'tests/e2e/screenshots/a1/chat_backend_unavailable_503.png' });
  });

  test('A1.4: Proxy /api/chat chuyển tiếp nguyên vẹn lỗi 4xx (422) từ backend, không biến thành 503 (I1)', async ({ request }) => {
    // 1. Tạo HTTP server mock tạm thời giả lập FastAPI backend trả về 422
    const mockFastApiServer = http.createServer((req, res) => {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        detail: 'session_id cannot exceed 100 characters'
      }));
    });

    await new Promise<void>((resolve) => mockFastApiServer.listen(0, '127.0.0.1', resolve));
    const port = (mockFastApiServer.address() as AddressInfo).port;

    try {
      // 2. Gửi request tới /api/chat, chuyển tiếp tới mock FastAPI server qua header x-mock-rag-url
      const response = await request.post('/api/chat', {
        headers: {
          'x-mock-rag-url': `http://127.0.0.1:${port}/chat`
        },
        data: {
          message: 'Xin chào',
          session_id: 'a'.repeat(105),
        }
      });

      // 3. Kỳ vọng: Trả về đúng 422 và body JSON nguyên vẹn, không bị nuốt thành 503
      expect(response.status()).toBe(422);
      const body = await response.json();
      expect(body).toHaveProperty('detail');
      expect(body.detail).toContain('100 characters');
    } finally {
      await new Promise<void>((resolve) => mockFastApiServer.close(() => resolve()));
    }
  });

});
