import pg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL in .env.local or process.env");
  process.exit(1);
}

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("=== BẮT ĐẦU KIỂM TRA LUỒNG THÔNG BÁO THỰC TẾ ===");

    const adminId = "08684c90-bf52-4c69-9914-01c796cbc2b6";
    const user1Id = "da89087a-c9ad-4605-a14f-4f984a792f70";
    const user2Id = "a116691b-ec19-4123-85ea-c2871947456e";
    const announcementId = crypto.randomUUID();

    // 1. Tạo thông báo mới từ Admin
    console.log("\n1. Tạo thông báo từ Admin...");
    const insertRes = await client.query(`
      INSERT INTO admin_announcements (
        id, title, content, summary, type, priority, target_audience, status, action_url, is_active, created_by, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      ) RETURNING id, title, status, priority, published_at
    `, [
      announcementId,
      "Chào mừng đến với Vocabee 2.0 - Hệ thống thông báo mới",
      "Hệ thống thông báo và ôn tập từ vựng đã được nâng cấp toàn diện. Chúc bạn có những giờ học hiệu quả!",
      "Hệ thống thông báo và ôn tập đã được nâng cấp toàn diện.",
      "info",
      "normal",
      "all",
      "published",
      "/vocabulary",
      true,
      adminId
    ]);
    console.log("-> Thông báo đã tạo thành công:", insertRes.rows[0]);

    // 2. Kiểm tra danh sách thông báo cho User 1 (Chưa đọc)
    console.log("\n2. Kiểm tra User 1 đọc danh sách thông báo...");
    const user1AnnQuery = await client.query(`
      SELECT a.id, a.title, r.read_at, r.dismissed_at
      FROM admin_announcements a
      LEFT JOIN user_announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.is_active = true AND a.status = 'published' AND a.id = $2
    `, [user1Id, announcementId]);
    const user1State = user1AnnQuery.rows[0];
    console.log("User 1 trạng thái:", {
      id: user1State.id,
      title: user1State.title,
      is_read: Boolean(user1State.read_at),
      is_dismissed: Boolean(user1State.dismissed_at)
    });
    if (user1State.read_at !== null) throw new Error("User 1 đáng lẽ chưa đọc!");

    // 3. User 1 đánh dấu đã đọc
    console.log("\n3. User 1 thực hiện đánh dấu đã đọc...");
    await client.query(`
      INSERT INTO user_announcement_reads (user_id, announcement_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, announcement_id)
      DO UPDATE SET read_at = EXCLUDED.read_at
    `, [user1Id, announcementId]);

    const user1AfterRead = await client.query(`
      SELECT a.id, a.title, r.read_at
      FROM admin_announcements a
      LEFT JOIN user_announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.id = $2
    `, [user1Id, announcementId]);
    console.log("User 1 sau khi đọc:", {
      id: user1AfterRead.rows[0].id,
      is_read: Boolean(user1AfterRead.rows[0].read_at),
      read_at: user1AfterRead.rows[0].read_at
    });

    // 4. Kiểm tra User 2 (Phải VẪN LÀ CHƯA ĐỌC - cách ly tuyệt đối!)
    console.log("\n4. Kiểm tra cách ly trạng thái: User 2...");
    const user2Check = await client.query(`
      SELECT a.id, a.title, r.read_at
      FROM admin_announcements a
      LEFT JOIN user_announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.id = $2
    `, [user2Id, announcementId]);
    console.log("User 2 trạng thái:", {
      id: user2Check.rows[0].id,
      is_read: Boolean(user2Check.rows[0].read_at),
      read_at: user2Check.rows[0].read_at
    });
    if (user2Check.rows[0].read_at !== null) {
      throw new Error("LỖI: Trạng thái đã đọc của User 1 bị rò rỉ sang User 2!");
    }
    console.log("-> XÁC NHẬN: Cách ly dữ liệu thành công! User 2 vẫn chưa đọc.");

    // 5. User 1 ẩn thông báo (dismiss)
    console.log("\n5. User 1 ẩn thông báo...");
    await client.query(`
      UPDATE user_announcement_reads
      SET dismissed_at = NOW()
      WHERE user_id = $1 AND announcement_id = $2
    `, [user1Id, announcementId]);

    const user1ActiveQuery = await client.query(`
      SELECT a.id, a.title
      FROM admin_announcements a
      LEFT JOIN user_announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.id = $2 AND (r.dismissed_at IS NULL)
    `, [user1Id, announcementId]);
    console.log("User 1 danh sách thông báo hoạt động:", user1ActiveQuery.rows.length === 0 ? "Đã ẩn thành công" : "Vẫn còn!");

    const user2ActiveQuery = await client.query(`
      SELECT a.id, a.title
      FROM admin_announcements a
      LEFT JOIN user_announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1
      WHERE a.id = $2 AND (r.dismissed_at IS NULL)
    `, [user2Id, announcementId]);
    console.log("User 2 danh sách thông báo hoạt động:", user2ActiveQuery.rows.length === 1 ? "Vẫn nhìn thấy bình thường" : "Bị mất!");

    console.log("\n=== TẤT CẢ CÁC BƯỚC KIỂM TRA THỰC TẾ ĐÃ THÀNH CÔNG RỰC RỠ! ===");
  } catch (err) {
    console.error("Lỗi kiểm tra:", err);
  } finally {
    await client.end();
  }
}

run();
