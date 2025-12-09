// app/api/products/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs";
import path from "path";
import { Product } from "@/types/default";


async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const timestamp = Date.now();
  const ext = path.extname(file.name) || ".jpg";
  const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9]/g, "")}${ext}`;
  const filePath = path.join(uploadDir, safeName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${safeName}`;
}

// Hàm xóa file ảnh từ ổ cứng
function deleteFile(imageUrl: string) {
  try {

    if (imageUrl && imageUrl.startsWith("/uploads/")) {
      // Đường dẫn thực tế: public/uploads/ten-anh.jpg
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Xóa file
      }
    }
  } catch (error) {
    console.error("Lỗi xóa file ảnh:", error);
    // Không throw lỗi ở đây để code vẫn tiếp tục xóa DB được
  }
}

export async function GET() {
  const stmt = db.prepare(`
    SELECT products.*, categories.name as categoryName 
    FROM products 
    LEFT JOIN categories ON products.categoryId = categories.id
    ORDER BY products.id DESC
  `);
  const products = stmt.all();

  // Đã bỏ brand, isSale, oldPrice
  const formatted = (products as Product[]).map((p) => ({
    ...p,
    category: p.categoryName ? { name: p.categoryName } : null,
  }));
  return NextResponse.json(formatted);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const imageFile = formData.get("imageFile") as File | null;
    let imageUrl = "";

    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile);
    } else {
      imageUrl =
        (formData.get("imageUrlInput") as string) ||
        "https://placehold.co/300x300?text=No+Image";
    }

    // Đã bỏ brand, oldPrice, isSale
    const stmt = db.prepare(`
      INSERT INTO products (name, price, image, url, categoryId)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      formData.get("name"),
      formData.get("price"),
      imageUrl,
      formData.get("url"),
      formData.get("categoryId") || null
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error("Lỗi upload:", error);
    return NextResponse.json(
      { error: "Lỗi khi lưu sản phẩm" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id");

    const imageFile = formData.get("imageFile") as File | null;
    let imageUrl = formData.get("existingImage") as string;

    // Logic: Nếu upload ảnh mới -> Có thể xóa ảnh cũ nếu muốn tiết kiệm dung lượng
    // Ở đây tôi làm đơn giản là ghi đè link mới thôi
    if (imageFile && imageFile.size > 0) {
        // (Optional) Nếu muốn xóa ảnh cũ khi update thì gọi deleteFile(imageUrl) ở đây trước khi gán link mới
        imageUrl = await saveFile(imageFile);
    } else {
        const urlInput = formData.get("imageUrlInput") as string;
        if (urlInput) imageUrl = urlInput;
    }

    // Đã bỏ brand, oldPrice, isSale
    const stmt = db.prepare(`
      UPDATE products 
      SET name=?, price=?, image=?, url=?, categoryId=?
      WHERE id = ?
    `);

    stmt.run(
      formData.get("name"),
      formData.get("price"),
      imageUrl,
      formData.get("url"),
      formData.get("categoryId") || null,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi update:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
      // 1. Lấy thông tin sản phẩm trước để lấy link ảnh
      const getStmt = db.prepare("SELECT image FROM products WHERE id = ?");
      const product = getStmt.get(id) as Product;

      // 2. Nếu có ảnh và ảnh nằm trong thư mục uploads thì xóa
      if (product && product.image) {
          deleteFile(product.image);
      }

      // 3. Xóa trong Database
      const delStmt = db.prepare("DELETE FROM products WHERE id = ?");
      delStmt.run(id);

      return NextResponse.json({ message: "Deleted product and image" });

  } catch (error) {
      console.error("Lỗi xóa:", error);
      return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
  }
}