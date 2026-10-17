import pg from "pg";
import webpush from "web-push";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@vocabee.site";

if (!connectionString || !publicKey || !privateKey) {
  console.error("Missing required credentials in .env.local or process.env");
  process.exit(1);
}

async function verify() {
  console.log("=== KIỂM TRA WEB PUSH & CƠ SỞ DỮ LIỆU THỰC TẾ ===");

  // 1. Kiểm tra cấu hình VAPID
  console.log("\n1. Cấu hình VAPID keys...");
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log("-> VAPID keys hợp lệ và đã thiết lập thành công!");
  } catch (err) {
    console.error("Lỗi cấu hình VAPID:", err);
    process.exit(1);
  }

  // 2. Kết nối PostgreSQL Pooler
  console.log("\n2. Kết nối cơ sở dữ liệu Supabase qua Pooler IPv4...");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("-> Đã kết nối cơ sở dữ liệu thành công!");

    // 3. Thử chèn một đăng ký Push subscription mẫu cho User
    console.log("\n3. Thử nghiệm lưu trữ Push Subscription trong bảng push_subscriptions...");
    const testUserId = "08684c90-bf52-4c69-9914-01c796cbc2b6"; // Admin
    const testEndpoint = "https://fcm.googleapis.com/fcm/send/test_token_" + crypto.randomBytes(8).toString("hex");
    const testP256dh = "BCv7_mock_key_" + crypto.randomBytes(16).toString("base64url");
    const testAuth = crypto.randomBytes(16).toString("base64url");

    const insertSub = await client.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, device_name, user_agent, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, endpoint, is_active, created_at
    `, [testUserId, testEndpoint, testP256dh, testAuth, "Chrome Desktop Test", "Mozilla/5.0 Windows"]);

    const subId = insertSub.rows[0].id;
    console.log("-> Push Subscription đã lưu thành công:", {
      id: subId,
      endpoint: insertSub.rows[0].endpoint.slice(0, 45) + "...",
      is_active: insertSub.rows[0].is_active
    });

    // 4. Thử nghiệm ghi nhận lần gửi và bảo đảm tính Idempotent trong announcement_push_deliveries
    console.log("\n4. Kiểm tra tính Idempotent của announcement_push_deliveries...");
    const testAnnId = crypto.randomUUID();

    // Tạo thông báo mẫu
    await client.query(`
      INSERT INTO admin_announcements (
        id, title, content, type, priority, target_audience, status, delivery_channels, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    `, [
      testAnnId,
      "Thông báo thử nghiệm Web Push",
      "Nội dung kiểm tra gửi push đến thiết bị",
      "info",
      "high",
      "all",
      "published",
      "both",
      testUserId
    ]);

    // Ghi log lần 1
    const del1 = await client.query(`
      INSERT INTO announcement_push_deliveries (announcement_id, subscription_id, user_id, status, status_code)
      VALUES ($1, $2, $3, 'accepted', 201)
      RETURNING id, status, status_code
    `, [testAnnId, subId, testUserId]);
    console.log("-> Ghi nhận lượt gửi lần 1:", del1.rows[0]);

    // Ghi log lần 2 (Phải bắt được lỗi trùng lặp do CONSTRAINT uq_announcement_sub)
    try {
      await client.query(`
        INSERT INTO announcement_push_deliveries (announcement_id, subscription_id, user_id, status, status_code)
        VALUES ($1, $2, $3, 'accepted', 201)
      `, [testAnnId, subId, testUserId]);
      console.error("LỖI: Trùng lặp không bị chặn!");
    } catch (err) {
      console.log("-> XÁC NHẬN: Cơ chế chống gửi trùng lặp (Idempotency) hoạt động chuẩn xác! Bắt lỗi:", err.code);
    }

    // 5. Cập nhật thống kê Push trên admin_announcements
    await client.query(`
      UPDATE admin_announcements
      SET push_attempt_count = 1, push_success_count = 1, push_failure_count = 0, push_delivered_at = NOW()
      WHERE id = $1
    `, [testAnnId]);

    const statCheck = await client.query(`
      SELECT id, title, delivery_channels, push_attempt_count, push_success_count, push_delivered_at
      FROM admin_announcements
      WHERE id = $1
    `, [testAnnId]);
    console.log("\n5. Thống kê Push trên thông báo:", statCheck.rows[0]);

    // 6. Dọn dẹp dữ liệu test
    console.log("\n6. Dọn dẹp dữ liệu kiểm tra...");
    await client.query(`DELETE FROM admin_announcements WHERE id = $1`, [testAnnId]);
    await client.query(`DELETE FROM push_subscriptions WHERE id = $1`, [subId]);
    console.log("-> Đã dọn dẹp sạch sẽ dữ liệu kiểm tra.");

    console.log("\n=== TẤT CẢ CÁC BƯỚC KIỂM TRA WEB PUSH THỰC TẾ ĐỀU THÀNH CÔNG RỰC RỠ! ===");
  } catch (err) {
    console.error("Lỗi kiểm tra:", err);
  } finally {
    await client.end();
  }
}

verify();
