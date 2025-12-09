"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash, Edit, Plus, User, Key, LogOut } from 'lucide-react';
import Image from 'next/image';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    rating: number;
    url: string;
    categoryId: number;
    category: Category;
}

export default function AdminPage() {
    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasAdminAccount, setHasAdminAccount] = useState(true); // Mặc định là true để không hiện form đăng ký bừa bãi
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Data States
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [affiliateLink, setAffiliateLink] = useState('');

    // UI States
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'account'
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [newCatName, setNewCatName] = useState('');

    // Change Password States
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Kiểm tra trạng thái Admin lúc mới vào
    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                // Check xem có admin chưa
                const res = await axios.get('/api/auth');
                setHasAdminAccount(res.data.hasAdmin);

                // Check xem đang login chưa
                const user = localStorage.getItem('admin_user');
                if (user) {
                    setIsLoggedIn(true);
                    setUsername(user);
                }
            } catch {
                console.error("Lỗi kiểm tra hệ thống");
            }
        };
        checkSystemStatus();
    }, []);


    const fetchData = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const [prodRes, setupRes] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/setup')
            ]);
            setProducts(prodRes.data);
            setCategories(setupRes.data.categories);
            if (setupRes.data.affiliateLink) setAffiliateLink(setupRes.data.affiliateLink.value);
        } catch { console.error("Lỗi tải data"); }
    }, [isLoggedIn]);

    useEffect(() => {
        (async () => {
            await fetchData();
        })();
    }, [fetchData]);


    // --- HANDLERS AUTH ---
    const handleRegister = async () => {
        if (!username || !password) return alert("Điền đầy đủ thông tin vào bro!");
        try {
            await axios.post('/api/auth', { action: 'register', username, password });
            alert("Tạo tài khoản Admin thành công! Giờ hãy đăng nhập.");
            setHasAdminAccount(true); // Chuyển sang form đăng nhập
            setPassword(''); // Xóa pass đi cho an toàn
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Lỗi tạo tài khoản!");
            }
        }
    }

    const handleLogin = async () => {
        try {
            const res = await axios.post('/api/auth', { action: 'login', username, password });
            if (res.data.success) {
                localStorage.setItem('admin_user', username);
                setIsLoggedIn(true);
                // fetchData sẽ tự chạy nhờ useEffect
            }
        } catch { alert('Sai tài khoản hoặc mật khẩu!'); }
    };

    const handleChangePassword = async () => {
        if (!oldPass || !newPass) return alert("Nhập đủ mật khẩu cũ và mới!");
        try {
            await axios.post('/api/auth', {
                action: 'change_password',
                username: username, // Lấy từ state
                oldPassword: oldPass,
                newPassword: newPass
            });
            alert("Đổi mật khẩu thành công!");
            setOldPass('');
            setNewPass('');
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Lỗi đổi mật khẩu");
            }
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
    }

    // --- CRUD HANDLERS (Giữ nguyên logic cũ, chỉ clean code) ---
    const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            if (editProduct?.id) {
                formData.append('id', String(editProduct.id));
                formData.append('existingImage', editProduct.image as string);
                await axios.put('/api/products', formData);
            } else {
                await axios.post('/api/products', formData);
            }

            setEditProduct(null);
            form.reset();
            if (fileInputRef.current) fileInputRef.current.value = "";
            fetchData();
        } catch (error) {
            alert("Lỗi khi lưu sản phẩm! Kiểm tra lại server.");
            console.error(error);
        }
    };


    const deleteProduct = async (id: number) => {
        if (!confirm("Xóa nhé?")) return;
        await axios.delete(`/api/products?id=${id}`);
        fetchData();
    };

    const saveCategory = async () => {
        if (!newCatName) return;
        await axios.post('/api/setup', { type: 'create_category', name: newCatName });
        setNewCatName('');
        fetchData();
    };

    const deleteCategory = async (id: number) => {
        if (!confirm("Xóa danh mục này?")) return;
        try {
            await axios.post('/api/setup', { type: 'delete_category', id });
            fetchData();
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Lỗi xóa danh mục");
            }
        }
    };

    const saveLink = async () => {
        await axios.post('/api/setup', { type: 'update_config', value: affiliateLink });
        alert("Lưu link thành công!");
    };

    // --- VIEW: LOGIN / REGISTER ---
    if (!isLoggedIn) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-6 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">
                    {hasAdminAccount ? 'Đăng nhập' : 'Khởi tạo tài khoản (Lần đầu)'}
                </h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Tài khoản</label>
                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Mật khẩu</label>
                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    {hasAdminAccount ? (
                        <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold transition-colors">
                            Đăng nhập
                        </button>
                    ) : (
                        <button onClick={handleRegister} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition-colors">
                            Tạo tài khoản
                        </button>
                    )}
                </div>
                {!hasAdminAccount && (
                    <p className="text-xs text-center text-gray-500 mt-4">
                        * Đây là lần đầu tiên chạy web, hãy tạo tài khoản admin. Tính năng này sẽ khóa sau khi tạo xong.
                    </p>
                )}
            </div>
        </div>
    );

    // --- VIEW: DASHBOARD ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                  
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        <User size={16} /> Xin chào, {username}
                    </span>
                    <button onClick={handleLogout} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                        <LogOut size={16} /> Thoát
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Sidebar Menu */}
                <div className="md:col-span-1 space-y-2">
                    <button onClick={() => setActiveTab('products')}
                        className={`w-full text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-600'}`}>
                        Sản phẩm
                    </button>
                    <button onClick={() => setActiveTab('categories')}
                        className={`w-full text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-600'}`}>
                        Danh mục & Link
                    </button>
                    <button onClick={() => setActiveTab('account')}
                        className={`w-full text-left px-4 py-2 rounded font-medium transition-colors ${activeTab === 'account' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-600'}`}>
                        Tài khoản
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">

                    {/* --- TAB: SẢN PHẨM --- */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h2 className="font-bold text-lg mb-4 text-slate-700">{editProduct ? `Sửa: ${editProduct.name}` : 'Thêm sản phẩm mới'}</h2>
                                <form onSubmit={saveProduct} className="grid grid-cols-2 gap-4">
                                    <input name="name" defaultValue={editProduct?.name} placeholder="Tên sản phẩm" required className="border p-2 col-span-2 rounded" />

                                    <div className='col-span-2'>
                                        <label className="block text-sm font-bold mb-1">Hình ảnh:</label>
                                        <input type="file" name="imageFile" accept="image/*" ref={fileInputRef} className="border p-2 w-full rounded mb-2 text-sm" />
                                        <input name="imageUrlInput" defaultValue={editProduct?.image.startsWith('http') ? editProduct.image : ''} placeholder="Hoặc dán link ảnh online..." className="border p-2 w-full rounded text-sm" />
                                        {editProduct?.image && (
                                            <div className="mt-2"><Image width={60} height={60} src={editProduct.image} alt="Current" className="rounded border object-cover" /></div>
                                        )}
                                    </div>

                                    <input name="price" type="number" defaultValue={editProduct?.price} placeholder="Giá bán" required className="border p-2 rounded" />
                                    <input name="url" defaultValue={editProduct?.url} placeholder="Link Shopee" required className="border p-2 rounded text-blue-600" />
                                    <select name="categoryId" defaultValue={editProduct?.categoryId || ""} className="border p-2 rounded col-span-2">
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>

                                    <div className="col-span-2 flex gap-2 pt-2">
                                        <button type="submit" className={`text-white py-2 px-4 rounded w-full font-bold ${editProduct ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                            {editProduct ? 'Lưu thay đổi' : 'Thêm mới'}
                                        </button>
                                        {editProduct && <button type="button" onClick={() => { setEditProduct(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="bg-gray-400 text-white py-2 px-4 rounded">Hủy</button>}
                                    </div>
                                </form>
                            </div>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {products.map(p => (
                                    <div key={p.id} className="flex gap-4 border p-3 rounded bg-white items-center shadow-sm">
                                        <Image width={60} height={60} src={p.image} className="rounded border bg-gray-50 object-cover h-14 w-14" alt={p.name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{p.name}</div>
                                            <div className="text-sm text-red-500 font-bold">{p.price.toLocaleString()}đ <span className="text-gray-400 font-normal ml-2 text-xs">{p.category?.name}</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditProduct(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit size={18} /></button>
                                            <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DANH MỤC & CONFIG --- */}
                    {activeTab === 'categories' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h2 className="font-bold mb-2 text-slate-700">Link Tiếp Thị Liên Kết (Affiliate)</h2>
                                <div className="flex gap-2">
                                    <input value={affiliateLink} onChange={e => setAffiliateLink(e.target.value)} className="border p-2 w-full rounded" placeholder="https://..." />
                                    <button onClick={saveLink} className="bg-blue-600 text-white px-4 rounded font-medium">Lưu</button>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
                                <h2 className="font-bold mb-4 text-slate-700">Quản lý Danh mục</h2>
                                <div className="flex gap-2 mb-4">
                                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Tên danh mục mới..." className="border p-2 flex-1 rounded" />
                                    <button onClick={saveCategory} className="bg-green-600 text-white p-2 rounded"><Plus /></button>
                                </div>
                                <ul className="space-y-2">
                                    {categories.map(c => (
                                        <li key={c.id} className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                                            <span className="font-medium">{c.name}</span>
                                            <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash size={16} /></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                   
                    {activeTab === 'account' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md mx-auto mt-10">
                            <div className="flex flex-col items-center mb-6">
                               
                                <h2 className="text-xl font-bold text-slate-800">{username}</h2>
                                <p className="text-sm text-slate-500">Quản trị viên</p>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Key size={18} /> Đổi mật khẩu</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu cũ</label>
                                        <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full border p-2 rounded mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu mới</label>
                                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full border p-2 rounded mt-1" />
                                    </div>
                                    <button onClick={handleChangePassword} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded font-bold mt-2">
                                        Cập nhật mật khẩu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}