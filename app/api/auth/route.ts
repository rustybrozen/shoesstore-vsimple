import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';


export async function GET() {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM admins');
    const result = stmt.get() as { count: number };
    return NextResponse.json({ hasAdmin: result.count > 0 });
  } catch {
    return NextResponse.json({ hasAdmin: false });
  }
}

export async function POST(req: Request) {
  const body = await req.json();


  if (body.action === 'register') {

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM admins');
    const result = countStmt.get() as { count: number };

    if (result.count > 0) {
      return NextResponse.json({ error: 'Lỗi!' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    try {
      const stmt = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
      stmt.run(body.username, hashedPassword);
      return NextResponse.json({ message: 'Created admin success' });
    } catch  {
      return NextResponse.json({ error: 'Lỗi khi tạo tài khoản' }, { status: 400 });
    }
  }

  // --- 2. ĐĂNG NHẬP ---
  if (body.action === 'login') {
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
    const user = stmt.get(body.username) as { username: string, password: string };

    if (!user) return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });

    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });

    return NextResponse.json({ success: true, username: user.username });
  }

  // --- 3. ĐỔI MẬT KHẨU ---
  if (body.action === 'change_password') {
    const { username, oldPassword, newPassword } = body;

    // Lấy thông tin user hiện tại
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
    const user = stmt.get(username) as { username: string, password: string };

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Kiểm tra mật khẩu cũ
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return NextResponse.json({ error: 'Mật khẩu cũ không đúng' }, { status: 400 });

    // Hash mật khẩu mới và cập nhật
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const updateStmt = db.prepare('UPDATE admins SET password = ? WHERE username = ?');
    updateStmt.run(newHashedPassword, username);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}