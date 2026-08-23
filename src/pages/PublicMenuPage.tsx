import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../services/catalogService';
import { Product, Category } from '../types';
import { Search, SearchX, ArrowLeft, X } from 'lucide-react';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const PublicMenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prodRes, catRes] = await Promise.all([
          productService.listProducts(),
          categoryService.listCategories(),
        ]);
        if (prodRes.success && prodRes.data) setProducts(prodRes.data);
        if (catRes.success && catRes.data) setCategories(catRes.data);
      } catch (err) {
        console.error('Error fetching public menu', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const catId = typeof p.category === 'string' ? p.category : p.category._id;
    const matchesCat = activeCategory === 'all' || catId === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

  const hasActiveFilter = searchQuery.trim() !== '' || activeCategory !== 'all';

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#1c1917] pb-24">
      {/* Top Banner Header with Back Button */}
      <div className="relative min-h-[360px] bg-gray-950 text-white flex items-center justify-center overflow-hidden px-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/70" />

        <div className="relative z-10 text-center space-y-4 max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-arabic-heading">
            منيو كافيه الفيشاوي
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-calligraphy max-w-2xl mx-auto">
            قائمة المشروبات والأصناف المتاحة
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة إلى الرئيسية</span>
            </Link>
          </div>
        </div>
</div>
 
       {/* Dynamic Catalog Section with Filter & Search */}
       <section className="py-12 px-6 max-w-6xl mx-auto w-full">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
           {/* Search Box */}
            <div className="relative w-full md:w-80 text-right">
              <Search className="w-4 h-4 text-[#2e5b9f] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن مشروب أو صنف مثل: كابتشينو، لاتيه، كرواسون"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pr-10 pl-9 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح البحث"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
 
           {/* Category Filter Pills - Responsive Wrap */}
           <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             <button
               onClick={() => setActiveCategory('all')}
               className={`py-2 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                 activeCategory === 'all'
                   ? 'bg-[#2e5b9f] text-white shadow-xs'
                   : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
               }`}
             >
               الكل
             </button>
             {categories.map((cat) => (
               <button
                 key={cat._id}
                 onClick={() => setActiveCategory(cat._id)}
                 className={`py-2 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                   activeCategory === cat._id
                     ? 'bg-[#2e5b9f] text-white shadow-xs'
                     : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                 }`}
               >
                 {cat.name}
               </button>
             ))}
           </div>
         </div>
 
         {/* Product Cards Grid */}
         {isLoading ? (
           <LoadingSkeleton type="tile" count={8} />
         ) : filteredProducts.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
             <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <p className="text-gray-600 font-bold text-sm">{searchQuery.trim() ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أصناف في هذه الفئة'}</p>
              <p className="text-xs text-gray-500 mt-2">{searchQuery.trim() ? `لم نجد أي مشروب أو صنف باسم «${searchQuery.trim()}». جرّب كلمة أخرى أو تصفّح فئة مختلفة.` : 'لا توجد أصناف متاحة ضمن هذه الفئة، جرّب فئة أخرى.'}</p>
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  مسح البحث والفلاتر
                </button>
              )}
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {filteredProducts.map((prod) => (
               <div
                 key={prod._id}
                 className="bg-white rounded-2xl overflow-hidden border border-gray-100/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
               >
                 <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
                   <img
                     src={prod.image?.secure_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'}
                     alt={prod.name}
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute top-2.5 right-2.5">
                     <span
                       className={`text-[10px] font-bold py-1 px-2.5 rounded-md shadow-xs ${
                         prod.inStock
                           ? 'bg-[#2e5b9f] text-white'
                           : 'bg-rose-600 text-white'
                       }`}
                     >
                       {prod.inStock ? 'متوفر' : 'غير متوفر'}
                     </span>
                   </div>
                 </div>
 
                 <div className="p-4 text-right flex flex-col justify-between flex-1">
                   <div>
                     <h3 className="font-bold text-gray-900 text-sm">{prod.name}</h3>
                     {prod.description && (
                       <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{prod.description}</p>
                     )}
                   </div>
 
                   <div className="pt-3 mt-3 border-t border-gray-50 flex items-baseline justify-between">
                     <span className="text-[11px] text-gray-400">السعر</span>
                     <span className="font-bold text-sm text-[#2e5b9f] font-mono">{prod.price} جنيها</span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </section>
     </div>
   );
 };
