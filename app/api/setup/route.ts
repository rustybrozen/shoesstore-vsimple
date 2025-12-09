import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const categories = db.prepare('SELECT * FROM categories').all();
  const config = db.prepare('SELECT * FROM configs WHERE key = ?').get('affiliate_intro');
  
  return NextResponse.json({ 
    categories, 
    affiliateLink: config ? config : { value: '' } 
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  
  if (body.type === 'create_category') {
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const info = stmt.run(body.name);
    return NextResponse.json({ id: info.lastInsertRowid, name: body.name });
  }
  
if (body.type === 'delete_category') {

    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE categoryId = ?');
    const result = checkStmt.get(body.id) as { count: number };

    if (result.count > 0) {
  
      return NextResponse.json(
        { error: `Không thể xóa! Đang có ${result.count} sản phẩm thuộc danh mục này.` }, 
        { status: 400 }
      );
    }

    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(body.id);
    return NextResponse.json({ success: true });
  }

  if (body.type === 'update_config') {
    const stmt = db.prepare(`
      INSERT INTO configs (key, value) VALUES ('affiliate_intro', ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    stmt.run(body.value);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}