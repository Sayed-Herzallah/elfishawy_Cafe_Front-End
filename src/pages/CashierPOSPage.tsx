import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/catalogService';
import { orderService } from '../services/opsService';
import { Product, Category, Order } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatPrice, formatNumber, formatTime } from '../utils/formatters';
import {
  Plus,
  Trash2,
  Search,
  SearchX,
  Coffee,
  Printer,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  ShoppingBag,
  X,
  AlertTriangle,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export const CashierPOSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [warnedProducts, setWarnedProducts] = useState<Record<string, boolean>>({});

  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Today's Orders Modal & Search
  const [isTodayOrdersOpen, setIsTodayOrdersOpen] = useState<boolean>(false);
  const [orderSearchText, setOrderSearchText] = useState<string>('');

  const { showToast, showError } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, ordRes] = await Promise.all([
        productService.listProducts(),
        categoryService.listCategories(),
        orderService.getOrders(),
      ]);

      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (ordRes.success && ordRes.data) {
        // Only allow Completed orders to be visible to the cashier POS view
        const completedOrders = ordRes.data.filter((o: Order) => o.status === 'completed');
        setAllOrders(completedOrders);
        setRecentOrders(completedOrders.slice(0, 4));
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToCart = (product: Product) => {
    if (!product.inStock || product.stockQuantity <= 0) {
      showToast(`صنف "${product.name}" نفد من المخزن`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        // Increment smoothly if within stock
        if (existing.quantity < product.stockQuantity) {
          return prev.map((item) =>
            item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          // Reached max limit - show alert ONLY ONCE
          if (!warnedProducts[product._id]) {
            showToast(`أقصى كمية متوفرة من "${product.name}" بالمخزن هي ${product.stockQuantity}`, 'info');
            setWarnedProducts((w) => ({ ...w, [product._id]: true }));
          }
          return prev;
        }
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleSetExactQuantity = (productId: string, newQty: number) => {
    const targetProduct = products.find((p) => p._id === productId);
    const maxLimit = targetProduct ? targetProduct.stockQuantity : 999;

    if (newQty >= maxLimit && targetProduct && !warnedProducts[productId]) {
      showToast(`أقصى كمية متوفرة من "${targetProduct.name}" هي ${maxLimit}`, 'info');
      setWarnedProducts((w) => ({ ...w, [productId]: true }));
    }

    const clampedQty = Math.min(Math.max(0, isNaN(newQty) ? 0 : newQty), maxLimit);

    setCart((prev) =>
      prev
        .map((item) => (item.product._id === productId ? { ...item, quantity: clampedQty } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleUpdateQuantityDelta = (productId: string, delta: number) => {
    const targetProduct = products.find((p) => p._id === productId);
    const maxLimit = targetProduct ? targetProduct.stockQuantity : 999;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > maxLimit) {
              if (targetProduct && !warnedProducts[productId]) {
                showToast(`أقصى كمية متوفرة هي ${maxLimit}`, 'info');
                setWarnedProducts((w) => ({ ...w, [productId]: true }));
              }
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const getProductImageUrl = (img: any): string => {
    if (typeof img === 'string' && img.trim()) return img;
    if (img && typeof img === 'object' && img.secure_url) return img.secure_url;
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
  };

  const handleClearCart = () => {
    setCart([]);
    setTableNumber('');
    setOrderNote('');
    setWarnedProducts({});
    showToast('تم بدء طلب جديد وتفريغ السلة', 'info');
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutAndPrint = async () => {
    if (cart.length === 0) {
      showToast('السلة فارغة. الرجاء اختيار طلبات أولاً', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const orderPayload = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        paymentMethod: 'cash' as const,
        orderType: 'dine-in' as const,
        tableNumber: tableNumber ? parseInt(tableNumber, 10) : 1,
      };

      const res = await orderService.createOrder(orderPayload);
      if (res.success && res.data) {
        showToast('تم تأكيد الطلب وحفظ الفاتورة بنجاح!');
        setSelectedReceiptOrder(res.data);
        handleClearCart();
        loadData();
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Order Functions
  const handleStartEditOrder = (order: Order) => {
    // Only allow editing pending orders
    if (order.status !== 'pending') {
      showToast('لا يمكن تعديل طلب تم تأكيده أو إلغاؤه', 'error');
      return;
    }
    
    // Populate cart from order items
    const cartItems = order.items.map(item => ({
      product: typeof item.product === 'string' 
        ? products.find(p => p._id === item.product) 
        : item.product,
      quantity: item.quantity,
    })).filter(item => item.product) as CartItem[];
    
    setCart(cartItems);
    setTableNumber(order.tableNumber ? String(order.tableNumber) : '');
    setOrderNote('');
    setEditingOrder(order);
    setIsEditMode(true);
    showToast('تم تحميل الطلب للتعديل', 'info');
  };

  const handleCancelEditMode = () => {
    setEditingOrder(null);
    setIsEditMode(false);
    handleClearCart();
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder || cart.length === 0) {
      showToast('لا توجد عناصر لتحديثها', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const orderPayload = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        paymentMethod: 'cash' as const,
        orderType: 'dine-in' as const,
        tableNumber: tableNumber ? parseInt(tableNumber, 10) : 1,
      };

      const res = await orderService.updateOrder(editingOrder._id, orderPayload);
      if (res.success && res.data) {
        showToast('تم تحديث الطلب بنجاح!');
        setSelectedReceiptOrder(res.data);
        handleCancelEditMode();
        loadData();
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const catId = typeof p.category === 'string' ? p.category : p.category._id;
    const matchesCat = activeCategory === 'all' || catId === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter today's orders by drink product name, order ID, or table
  const filteredTodayOrders = allOrders.filter((ord) => {
    const q = orderSearchText.trim().toLowerCase();
    if (!q) return true;

    const matchesId = ord.orderNumber.toLowerCase().includes(q) || ord._id.toLowerCase().includes(q);
    const matchesTable = ord.tableNumber ? String(ord.tableNumber).includes(q) : false;
    const matchesDrink = ord.items.some((it) => {
      const pName = typeof it.product === 'object' ? it.product.name : '';
      return pName.toLowerCase().includes(q);
    });

    return matchesId || matchesTable || matchesDrink;
  });

  const todayRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex flex-col gap-4 text-right font-sans">
      {/* Top Bar: Action, View All Today's Orders, & Quick Last 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/70">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClearCart}
            className="inline-flex items-center gap-1.5 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>طلب جديد</span>
          </button>

          <button
            onClick={() => setIsTodayOrdersOpen(true)}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#2e5b9f] border border-blue-200 font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>سجل فواتير اليوم</span>
          </button>
        </div>

        {recentOrders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
              آخر 4 طلبات سابقة:
            </span>
            {recentOrders.slice(0, 4).map((ord) => (
              <div key={ord._id} className="inline-flex items-center gap-1">
                <button
                  onClick={() => setSelectedReceiptOrder(ord)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 transition cursor-pointer shadow-2xs whitespace-nowrap"
                  title="نقر لطباعة أو معاينة الفاتورة"
                >
                  <Printer className="w-3.5 h-3.5 text-[#2e5b9f]" />
                  <span className="font-bold">#{ord.orderNumber.slice(-4)}</span>
                </button>
                {ord.status === 'pending' && (
                  <button
                    onClick={() => handleStartEditOrder(ord)}
                    className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition cursor-pointer shadow-2xs whitespace-nowrap"
                    title="تعديل الطلب"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Cart Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 flex flex-col justify-between order-2 lg:order-1 sticky top-16">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-3.5">
              <span className="text-xs font-bold bg-blue-50 text-[#2e5b9f] px-3 py-1 rounded-lg font-mono">
                {formatNumber(totalItemsCount)} أصناف
              </span>
              <h2 className="text-base font-bold font-arabic-heading text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2e5b9f]" />
                <span>الطلب الحالي (السلة)</span>
              </h2>
            </div>

            {/* Cart Items with clear spacious typography */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-[#faf8f5]">
                <Coffee className="w-9 h-9 mx-auto mb-2 opacity-30 text-[#2e5b9f]" />
                <p className="text-sm font-bold text-gray-700">السلة فارغة</p>
                <p className="text-xs text-gray-400 mt-1">انقر على المشروبات لإضافتها للطلب</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product._id}
                    className="p-3.5 rounded-2xl bg-[#faf8f5] border border-gray-200/70 flex items-center justify-between gap-3 shadow-2xs hover:border-gray-300 transition"
                  >
                    {/* Price and Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRemoveFromCart(item.product._id)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition cursor-pointer"
                        title="حذف الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span className="text-base font-bold font-mono text-[#2e5b9f] whitespace-nowrap min-w-[65px] text-left">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantityDelta(item.product._id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        +
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stockQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          handleSetExactQuantity(item.product._id, parseInt(e.target.value, 10))
                        }
                        className="w-10 text-center text-sm font-bold font-mono text-gray-900 focus:outline-none bg-transparent py-1 border-x border-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantityDelta(item.product._id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        -
                      </button>
                    </div>

                    {/* Product Name (Full Visibility, larger text) */}
                    <div className="text-right flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-900 block truncate leading-snug">
                        {item.product.name}
                      </span>
                      <span className="text-xs text-gray-500 font-mono mt-0.5 block">
                        {formatPrice(item.product.price)} للقطعة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table Number (Strictly positive, no negative) & Notes */}
            <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-2 gap-2.5">
              <input
                type="number"
                min="1"
                placeholder="رقم الطاولة (مثال: 4)"
                value={tableNumber}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTableNumber('');
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num > 0) setTableNumber(String(num));
                  }
                }}
                className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f] text-right font-medium shadow-2xs"
              />

              <input
                type="text"
                placeholder="ملاحظات (سكر زيادة، دبل...)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f] text-right shadow-2xs"
              />
            </div>

            {/* Total Row with prominent numbers */}
            <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between text-gray-900 shadow-2xs">
              <span className="font-mono text-2xl font-bold text-[#2e5b9f]">
                {formatPrice(totalAmount)}
              </span>
              <span className="text-sm font-bold font-arabic-heading">المجموع الإجمالي:</span>
            </div>
          </div>

          {/* Direct Print Button */}
          <div className="mt-4">
            {isEditMode && editingOrder && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  وضع التعديل - طلب #{editingOrder.orderNumber.slice(-4)}
                </span>
                <button
                  onClick={handleCancelEditMode}
                  className="text-amber-600 hover:text-amber-800 font-bold text-xs px-2 py-1 rounded-lg hover:bg-amber-100 transition"
                >
                  إلغاء التعديل
                </button>
              </div>
            )}
            <button
              onClick={isEditMode ? handleUpdateOrder : handleCheckoutAndPrint}
              disabled={isSubmitting || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-2xs cursor-pointer"
            >
              <Printer className="w-5 h-5 ml-1" />
              <span>
                {isSubmitting
                  ? 'جاري الحفظ...'
                  : isEditMode
                  ? 'تحديث الطلب وطباعة الفاتورة 🖨️'
                  : 'تأكيد الطلب وطباعة الفاتورة 🖨️'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Products Grid & Search (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5 order-1 lg:order-2">
          {/* Search and Category Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#2e5b9f] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن مشروب، صنف، قهوة، تحلية — مثال: كابتشينو"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#faf8f5] border border-gray-200 rounded-xl pr-10 pl-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f] text-right"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#2e5b9f] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                الكل ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat._id
                      ? 'bg-[#2e5b9f] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          {isLoading ? (
            <LoadingSkeleton type="tile" count={6} />
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <p className="text-gray-600 font-bold text-sm">لا توجد منتجات مطابقة للبحث</p>
              <p className="text-xs text-gray-500 mt-2">جرّب كتابة اسم آخر أو اختر تصنيفاً مختلفاً من الأعلى</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = !product.inStock || product.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && product.stockQuantity <= 5;
                const cartQty = cart.find((i) => i.product._id === product._id)?.quantity || 0;

                return (
                  <button
                    key={product._id}
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative bg-white rounded-xl border p-2.5 text-right flex flex-col justify-between transition group shadow-xs cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-50 border-gray-200 cursor-not-allowed bg-gray-50'
                        : cartQty > 0
                        ? 'border-[#2e5b9f] ring-2 ring-[#2e5b9f]/20 bg-blue-50/20'
                        : 'border-gray-200/80 hover:border-[#2e5b9f] hover:shadow-sm'
                    }`}
                  >
                    {/* Badge for Cart Count */}
                    {cartQty > 0 && (
                      <span className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-[#2e5b9f] text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs">
                        {cartQty}
                      </span>
                    )}

                    {/* Image */}
                    <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-gray-100 relative">
                      <img
                        src={getProductImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                      {isLowStock && (
                        <span className="absolute bottom-1 right-1 bg-amber-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          متبقي {product.stockQuantity} فقط
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="text-right flex-1 min-h-[50px] flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1 mb-0.5">
                          {product.name}
                        </h3>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      {/* Stock indicator */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                        {isOutOfStock ? (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                            <X className="w-3 h-3" />
                            نافد
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formatNumber(product.stockQuantity)} متبقي
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            متوفر
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: All Today's Orders & Product Search */}
      <Modal
        isOpen={isTodayOrdersOpen}
        onClose={() => setIsTodayOrdersOpen(false)}
        title="سجل فواتير وطلبات اليوم"
        maxWidth="lg"
      >
        <div className="space-y-4 text-right font-sans">
          {/* Quick Header Metric - Hidden totals for security */}
          <div className="p-3 bg-[#faf8f5] border border-gray-200 rounded-xl text-center shadow-3xs">
            <span className="text-xs font-bold text-gray-700">سجل فواتير اليوم الصادرة للمطابقة والمراجعة</span>
          </div>

          {/* Search Bar for Product or Order ID */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المشروب (مثال: كابتشينو، لاتيه)، أو رقم الفاتورة، أو الطاولة..."
              value={orderSearchText}
              onChange={(e) => setOrderSearchText(e.target.value)}
              className="w-full bg-[#faf8f5] border border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f]"
              autoFocus
            />
          </div>

          {/* Orders List */}
          {filteredTodayOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-[#faf8f5] border border-dashed border-gray-200 rounded-xl">
              <SearchX className="w-6 h-6 text-[#2e5b9f] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-gray-600">لا توجد فواتير تطابق بحثك</p>
              <p className="text-[11px] text-gray-400 mt-1">جرّب رقم فاتورة أو اسم مشروب أو رقم طاولة آخر</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredTodayOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-2xs hover:border-gray-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-gray-900">
                        #{ord.orderNumber.replace(/[^0-9]/g, '')}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatTime(ord.createdAt)}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        طاولة #{ord.tableNumber || 1}
                      </span>
                    </div>

                    {/* Drink items preview */}
                    <div className="text-xs text-gray-600 flex flex-wrap gap-1.5 pt-1">
                      {ord.items.map((item, idx) => {
                        const name = typeof item.product === 'object' ? item.product.name : 'مشروب';
                        return (
                          <span key={idx} className="bg-[#faf8f5] border border-gray-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {name} (×{formatNumber(item.quantity)})
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedReceiptOrder(ord);
                      }}
                      className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                      title="طباعة الفاتورة"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#2e5b9f]" />
                      <span>طباعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Direct Receipt Print Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
