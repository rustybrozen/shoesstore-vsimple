/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useEffect } from 'react';
import { Star, Search, Clock, Sun, Moon, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { Product, Category } from '@/types/default';




export default function App() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [introLink, setIntroLink] = useState(''); 

  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
        try {
            const [prodRes, setupRes] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/setup')
            ]);
            setProducts(prodRes.data);
            setCategories([{id: 0, name: "Tất cả"}, ...setupRes.data.categories]);
            if(setupRes.data.affiliateLink) setIntroLink(setupRes.data.affiliateLink.value);
        } catch (error) {
            console.error("Lỗi lấy data:", error);
        }
    };
    fetchData();

    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

 const handleBuyNow = (url: string) => {
    if (!url) return;
    
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = `https://${url}`;
    }
    
    window.open(finalUrl, '_blank'); 
};


  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "Tất cả" || (product.category && product.category.name === activeCategory) || (!product.category && activeCategory === "Tất cả");

    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen font-sans relative pb-20 transition-colors duration-300 
      ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
   
      <header className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
             <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Shoes Store</h1>
             <div className="bg-orange-400 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                 <Clock size={12} />
                 <span>{formatTime(currentTime)}</span>
             </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 shadow-sm'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {introLink && (
            <div onClick={() => window.open(introLink, '_blank')} className={`text-sm hover:underline cursor-pointer ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
             Giới Thiệu Tiếp Thị Liên Kết
            </div>
        )}
      </header>

   
      <main className="max-w-6xl mx-auto px-4 mt-4 flex flex-col items-center">
        
        <div className="flex flex-col gap-3 w-full max-w-md mb-6">
            <button className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 px-6 rounded-md font-medium shadow-sm">
              Tham gia ngay tại đây
            </button>
            <button onClick={() => router.push('/admin')} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium flex items-center justify-center gap-2 shadow-sm">
              <ShieldCheck size={18} /> Quản Trị Viên
            </button>
        </div>

        <p className={`mb-6 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Chào mừng đến với Shoes Store! Chọn sản phẩm hoặc tìm kiếm để duyệt.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map((cat: { id: number; name: string }) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-all
                ${activeCategory === cat.name 
                  ? 'bg-slate-700 text-white border-slate-700' 
                  : isDarkMode 
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={`w-full max-w-3xl flex items-center mb-10 shadow-sm border rounded-md overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="pl-3 text-slate-400"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm..." 
            className={`flex-1 px-3 py-2.5 outline-none bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product.id} className={`rounded-lg border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden h-full group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className={`relative h-48 sm:h-56 overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <img

                  src={product.image} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"/>
                </div>

                <div className="p-4 flex flex-col flex-1 text-center">
                  <h3 className={`font-medium text-sm line-clamp-2 mb-2 min-h-10 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</h3>
                  <div className="mt-auto flex flex-col items-center gap-2">
                     <div className="flex flex-col items-center">
                        <span className={`font-bold text-lg text-red-500`}>{product.price.toLocaleString('vi-VN')}đ</span>
                     </div>
                     <button onClick={() => handleBuyNow(product.url)} className="bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded font-bold text-sm uppercase shadow-md">Mua ngay</button>
                     <div className="flex justify-center text-yellow-400 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < product.rating ? "currentColor" : "none"} strokeWidth={i < product.rating ? 0 : 2} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-full text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Không tìm thấy sản phẩm nào!
            </div>
          )}
        </div>

        <div className={`mt-12 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
           © Quyền Shoes Store Được Bảo Lưu Shopee.
        </div>
      </main>
    </div>
  );
}