/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useEffect } from 'react';
import { Star, Search, User, ChevronDown, ChevronUp, X } from 'lucide-react'; 
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/types/default';

const AVATAR_URL = "https://ui-avatars.com/api/?name=Shoe+Store&background=random"; 

export default function App() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [introLink, setIntroLink] = useState('');

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [activeCategory, setActiveCategory] = useState("Tất cả"); 
  
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'sales' | 'price-asc' | 'price-desc'>('popular');
  const [searchQuery, setSearchQuery] = useState("");

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
            console.error(error);
        }
    };
    fetchData();
  }, []);

  const handleBuyNow = (url: string) => {
    if (!url) return;
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = `https://${url}`;
    }
    window.open(finalUrl, '_blank');
  };

  const handleCategoryClick = (catName: string) => {
      if (activeCategory === catName) {
        setActiveCategory("Tất cả");
      } else {
        setActiveCategory(catName);
        setActiveTab('products');
      }
  };

  const handlePriceSort = () => {
    if (sortBy === 'price-asc') {
        setSortBy('price-desc');
    } else {
        setSortBy('price-asc');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "Tất cả" || (product.category && product.category.name === activeCategory) || (!product.category && activeCategory === "Tất cả");
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
          case 'newest':
              return b.id - a.id; 
          case 'price-asc':
              return a.price - b.price;
          case 'price-desc':
              return b.price - a.price;
          default:
              return 0;
      }
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      <header className="sticky top-0 z-50 bg-gradient-to-b from-orange-600 to-orange-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 py-3">
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-white rounded-sm flex items-center px-3 py-1.5 shadow-sm">
                    <Search size={16} className="text-gray-400 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        className="flex-1 text-sm text-gray-800 outline-none bg-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => router.push('/admin')} 
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <User size={20} className="text-white" />
                </button>
            </div>

            <div className="flex items-center gap-3 mt-3 pb-1">
                 <img src={AVATAR_URL} alt="Avatar" className="w-12 h-12 rounded-full border border-white/50 object-cover" />
                 <div className="flex-1">
                    <h1 className="font-bold text-base leading-tight">Shoe Store</h1>
                    {introLink && (
                        <div 
                            onClick={() => window.open(introLink, '_blank')}
                            className="text-xs bg-black/20 inline-block px-2 py-0.5 rounded mt-1 cursor-pointer hover:bg-black/30"
                        >
                            Tham gia tiếp thị liên kết ngay tại đây &rsaquo;
                        </div>
                    )}
                 </div>
            </div>
            <p className="text-xs text-white/90 line-clamp-2 px-1 mt-2">
                Chào mừng đến với Shoes Store! Chọn sản phẩm hoặc tìm kiếm sản phẩm ưng nhất cho bản thân
            </p>
        </div>
      </header>

      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-[138px] md:top-[120px] z-40"> 
          <div className="max-w-7xl mx-auto flex text-sm font-medium text-gray-600">
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'products' ? 'border-orange-500 text-orange-500' : 'border-transparent'}`}
              >
                  Sản phẩm
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'categories' ? 'border-orange-500 text-orange-500' : 'border-transparent'}`}
              >
                  Danh mục
              </button>
          </div>
          


          {activeTab === 'products' && activeCategory !== "Tất cả" && (
            <div className="flex items-center justify-between max-w-7xl mx-auto   px-3 py-2  border-t border-orange-100">
                <span className="text-xs text-orange-800">
                    Đang lọc: <strong>{activeCategory}</strong>
                </span>
                <button onClick={() => setActiveCategory("Tất cả")} className="text-orange-600">
                    <X size={16} />
                </button>
            </div>
          )}
      </div>

      <main className="max-w-7xl mx-auto px-2 py-3">
        {activeTab === 'products' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {sortedProducts.length > 0 ? (
                sortedProducts.map(product => (
                <div 
                    key={product.id} 
                    className="bg-white rounded-sm shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-orange-300 flex flex-col h-full group relative"
                >
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                        <div onClick={() => handleBuyNow(product.url)} className="cursor-pointer w-full h-full">
                            <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy" 
                            />
                        </div>
                    </div>

                    <div className="p-2 flex flex-col flex-1">
                        <h3 
                            onClick={() => handleBuyNow(product.url)}
                            className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-2 cursor-pointer hover:text-orange-600 min-h-[32px] leading-4"
                        >
                            {product.name}
                        </h3>
                        
                        <div className="mt-auto flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-red-600 font-bold text-sm md:text-base">
                                    {product.price.toLocaleString('vi-VN')}đ
                                </span>
                                
                                <div className="flex items-center text-xs text-gray-500">
                                    <span className="mr-1">{product.rating}</span>
                                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleBuyNow(product.url);
                                }}
                                className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-1.5 rounded-sm transition-colors uppercase tracking-wide"
                            >
                                Mua ngay
                            </button>
                        </div>
                    </div>
                </div>
                ))
            ) : (
                <div className="col-span-full text-center py-12 text-gray-500 flex flex-col items-center">
                    <Search className="w-12 h-12 text-gray-300 mb-2"/>
                    <p>Không tìm thấy sản phẩm nào bro ơi!</p>
                </div>
            )}
            </div>
        )}

        {activeTab === 'categories' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categories.map((cat) => (
                    <button 
                        key={cat.id} 
                        onClick={() => handleCategoryClick(cat.name)}
                        className={`p-3 rounded flex flex-col items-center justify-center gap-2 shadow-sm border transition-all
                            ${activeCategory === cat.name 
                                ? 'bg-orange-50 border-orange-500 text-orange-700' 
                                : 'bg-white border-transparent hover:border-orange-200 text-gray-700'}`}
                    >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                             ${activeCategory === cat.name ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                            <span className="font-bold text-lg">{cat.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-center line-clamp-2">
                            {cat.name}
                        </span>
                        {activeCategory === cat.name && (
                            <span className="text-[10px] text-orange-500 underline">Đang chọn</span>
                        )}
                    </button>
                ))}
            </div>
        )}
      </main>

    </div>
  );
}