import React, { useState, useEffect } from 'react';
import { productService, categoryService, recipeService } from '../../services/catalogService';
import { inventoryService } from '../../services/opsService';
import { Product, Category, InventoryItem } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { formatPrice, formatNumber } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterDialog } from '../../components/ui/FilterDialog';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Coffee,
  Filter,
  FolderPlus,
  Eye,
  X,
  Calculator,
  Trash2 as TrashIcon,
  FlaskConical,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categoryErrors, setCategoryErrors] = useState<{ name?: string }>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isCategoryFormSubmitted, setIsCategoryFormSubmitted] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Filter Dialog
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    imageFile: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string; category?: string; stockQuantity?: string; imageFile?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Recipe / Raw-material linking for auto stock calc
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipeRows, setRecipeRows] = useState<{ inventoryItem: string; consumeQty: string; consumeUnit: string }[]>([]);
  const [computedAvailable, setComputedAvailable] = useState<number | null>(null);
  const [recipeErrors, setRecipeErrors] = useState<{ row?: string }>({});
  const [recipeData, setRecipeData] = useState<{ availableProductQty: number; ingredientDetails: any[] } | null>(null);

  const { showToast, showError } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, invRes] = await Promise.all([
        productService.listProducts(),
        categoryService.listCategories(),
        inventoryService.listInventory(),
      ]);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (invRes.success && invRes.data) setInventoryItems(invRes.data);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute how many product units we can make from the linked raw inventory
  // Eg: linked "Coffee beans" with 2 LITER current and consumeQty 0.02 per cup => 100 cups available.
  // Compute how many product units we can make from the linked raw inventory
  // Handles unit conversion to get accurate cup/piece calculation
  const computeAvailableFromInventory = (rows: { inventoryItem: string; consumeQty: string; consumeUnit: string }[]): number | null => {
    if (!rows || rows.length === 0) return null;
    let minAvailable = Infinity;

    // Helper to get base quantity in smallest unit (GRAM / ML / PIECE)
    const getQtyInBase = (value: number, unit: string): number => {
      const u = unit.toUpperCase();
      if (u === 'KG' || u === 'LITER') return value * 1000;
      return value; // GRAM, ML, PIECE
    };

    for (const row of rows) {
      const qty = Number(row.consumeQty);
      if (!row.inventoryItem || !qty || qty <= 0) continue;
      const inv = inventoryItems.find((i) => i._id === row.inventoryItem);
      if (!inv || inv.quantity <= 0) {
        minAvailable = 0;
        continue;
      }

      // Convert both inventory quantity and consume quantity to base units
      const invBase = getQtyInBase(inv.quantity, inv.unit);
      const consumeBase = getQtyInBase(qty, row.consumeUnit || 'GRAM');

      if (consumeBase <= 0) continue;

      // Calculate how many units we can make
      const unitsForThis = Math.floor(invBase / consumeBase);
      minAvailable = Math.min(minAvailable, unitsForThis);
    }
    return Number.isFinite(minAvailable) ? minAvailable : null;
  };

  const updateComputedAvailable = (rows: { inventoryItem: string; consumeQty: string; consumeUnit: string }[]) => {
    setComputedAvailable(computeAvailableFromInventory(rows));
  };

  const handleRecipeRowChange = (idx: number, field: 'inventoryItem' | 'consumeQty' | 'consumeUnit', value: string) => {
    const updated = recipeRows.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setRecipeRows(updated);
    setRecipeErrors({});
    updateComputedAvailable(updated);
  };

  const addRecipeRow = () => {
    const unused = inventoryItems.find((i) => !recipeRows.some((r) => r.inventoryItem === i._id));
    setRecipeRows((prev) => [
      ...prev,
      { inventoryItem: unused?._id || inventoryItems[0]?._id || '', consumeQty: '', consumeUnit: 'KG' },
    ]);
    setRecipeErrors({});
  };

  const removeRecipeRow = (idx: number) => {
    const updated = recipeRows.filter((_, i) => i !== idx);
    setRecipeRows(updated);
    updateComputedAvailable(updated);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Automatically sync computed availability with stock quantity form field
  useEffect(() => {
    const calculated = recipeData?.availableProductQty !== undefined && recipeData?.availableProductQty !== null
      ? recipeData.availableProductQty
      : computedAvailable;

    if (calculated !== null && calculated !== undefined) {
      setFormData((prev) => ({ ...prev, stockQuantity: String(calculated) }));
    }
  }, [computedAvailable, recipeData]);

  // Filter Dialog Config
  const filterDialogConfig = {
    title: 'تصفية المنتجات',
    fields: [
      {
        name: 'search',
        label: 'بحث',
        type: 'input' as const,
        placeholder: 'الاسم أو الوصف...',
        defaultValue: searchQuery,
      },
      {
        name: 'category',
        label: 'التصنيف',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'الكل' },
          ...categories.map((c) => ({ value: c._id, label: c.name })),
        ],
        defaultValue: activeCategory,
      },
      {
        name: 'stockFilter',
        label: 'حالة المخزون',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'in', label: 'متوفر' },
          { value: 'out', label: 'نافد' },
        ],
        defaultValue: stockFilter,
      },
      {
        name: 'dateFrom',
        label: 'من تاريخ',
        type: 'date' as const,
        defaultValue: dateFrom,
      },
      {
        name: 'dateTo',
        label: 'إلى تاريخ',
        type: 'date' as const,
        defaultValue: dateTo,
      },
    ],
    activeFiltersCount: (searchQuery ? 1 : 0) + (activeCategory !== 'all' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0),
  };

  const handleFilterApply = (values: any) => {
    if (values.search !== undefined) setSearchQuery(values.search);
    if (values.category !== undefined) setActiveCategory(values.category);
    if (values.stockFilter !== undefined) setStockFilter(values.stockFilter);
    if (values.dateFrom !== undefined) setDateFrom(values.dateFrom);
    if (values.dateTo !== undefined) setDateTo(values.dateTo);
    setIsFilterDialogOpen(false);
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setStockFilter('all');
    setDateFrom('');
    setDateTo('');
    setIsFilterDialogOpen(false);
  };

  const getProductImageUrl = (img: any): string => {
    if (typeof img === 'string' && img.trim()) return img;
    if (img && typeof img === 'object' && img.secure_url) return img.secure_url;
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormErrors({});
    setRecipeErrors({});
    setRecipeRows([]);
    setComputedAvailable(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories[0]?._id || '',
      stockQuantity: '',
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormErrors({});
    setRecipeErrors({});
    setRecipeRows([]);
    setComputedAvailable(null);
    setRecipeData(null);
    const catId = typeof prod.category === 'string' ? prod.category : prod.category._id;
    setFormData({
      name: prod.name,
      description: prod.description || '',
      price: String(prod.price),
      category: catId,
      stockQuantity: String(prod.stockQuantity),
      imageFile: null,
    });
    
    // Fetch recipe data from backend to get calculated available quantity
    recipeService.getRecipeByProduct(prod._id).then((res) => {
      if (res.success && res.data) {
        setRecipeData({
          availableProductQty: res.data.availableProductQty,
          ingredientDetails: res.data.ingredientDetails || [],
        });
        // Populate recipe rows from backend
        if (res.data.ingredientDetails && res.data.ingredientDetails.length > 0) {
          const rows = res.data.ingredientDetails.map((ing: any) => ({
            inventoryItem: typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem._id,
            consumeQty: String(ing.consumptionPerUnitInBase || 0),
            consumeUnit: ing.inputUnit || 'KG',
          }));
          setRecipeRows(rows);
          updateComputedAvailable(rows);
        }
      }
    }).catch(() => {
      // Recipe not found or error - continue without recipe data
    });
    
    setIsModalOpen(true);
  };

  const handleViewProduct = (prod: Product) => {
    setViewingProduct(prod);
    setIsViewModalOpen(true);
    // Fetch recipe data for available quantity calculation
    recipeService.getRecipeByProduct(prod._id).then((res) => {
      if (res.success && res.data) {
        setRecipeData({
          availableProductQty: res.data.availableProductQty,
          ingredientDetails: res.data.ingredientDetails || [],
        });
      }
    }).catch(() => {
      setRecipeData(null);
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCategoryFormSubmitted(true);
    const errors: { name?: string } = {};

    if (!categoryForm.name.trim()) {
      errors.name = 'اسم التصنيف مطلوب';
    }

    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setCategoryErrors({});

    try {
      setIsAddingCategory(true);
      const res = await categoryService.createCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });

      if (res.success) {
        showToast(`تم إنشاء التصنيف "${categoryForm.name.trim()}" بنجاح`);
        setIsCategoryModalOpen(false);
        setCategoryForm({ name: '', description: '' });
        loadData();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      const res = await productService.deleteProduct(deleteTarget.id);
      if (res.success) {
        showToast(`تم حذف المنتج "${deleteTarget.name}" بنجاح`);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true);
    const errors: { name?: string; price?: string; category?: string; stockQuantity?: string; imageFile?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم المنتج مطلوب';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'الرجاء إدخال سعر صحيح أكبر من صفر';
    }
    if (!formData.category) {
      errors.category = 'الرجاء اختيار تصنيف المنتج';
    }
    // Only require manual stock quantity if no recipe ingredients are linked
    if (recipeRows.length === 0) {
      if (formData.stockQuantity === '' || Number(formData.stockQuantity) < 0) {
        errors.stockQuantity = 'الرجاء إدخال كمية مخزون صحيحة';
      }
    }
    
    // Require image when creating a new product
    if (!editingProduct && !formData.imageFile) {
      errors.imageFile = 'صورة المنتج مطلوبة إجبارياً لإضافة الصنف';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setFormErrors({});

    // Validate recipe rows: every row must have a raw item + positive consume qty
    const validRows = recipeRows.filter((r) => r.inventoryItem && Number(r.consumeQty) > 0);
    if (recipeRows.length > 0 && validRows.length !== recipeRows.length) {
      setRecipeErrors({ row: 'أكمل اختيار الخامة وكمية الاستهلاك لكل صف (أو احذف الصف الفارغ)' });
      showToast('الرجاء إكمال بيانات الخامات المرتبطة (أو حذف الصف الفارغ)', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description.trim());
      data.append('price', formData.price);
      data.append('category', formData.category);
      const finalStockQty = recipeRows.length > 0 
        ? String(computedAvailable !== null ? computedAvailable : (recipeData?.availableProductQty || 0))
        : (formData.stockQuantity || '0');
        
      data.append('stockQuantity', finalStockQty);
      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      let savedProductId = editingProduct ? editingProduct._id : '';

      if (editingProduct) {
        const res = await productService.updateProduct(editingProduct._id, data);
        if (res.success) {
          savedProductId = editingProduct._id;
          showToast('تم تحديث المنتج بنجاح');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await productService.createProduct(data);
        if (res.success && res.data) {
          savedProductId = res.data._id;
          // Automatically sync the recipe (bill of materials) so stock auto-calculates
          if (validRows.length > 0) {
            try {
              const existingRecipes = await recipeService.listRecipes();
              const current = Array.isArray(existingRecipes?.data) ? existingRecipes.data : [];
              const existingRecipe = current.find(
                (rec) => (typeof rec.product === 'string' ? rec.product : rec.product._id) === savedProductId
              );
              const ingredients = validRows.map((r) => ({
                inventoryItem: r.inventoryItem,
                inputQuantity: Number(r.consumeQty),
                inputUnit: r.consumeUnit as 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PIECE',
                outputQuantity: 1,
              }));
              if (existingRecipe) {
                await recipeService.updateRecipe(existingRecipe._id, { ingredients });
              } else {
                await recipeService.createRecipe({ product: savedProductId, ingredients, isActive: true });
              }
              showToast('تمت إضافة المنتج وربط الخامات للمخزون بنجاح');
            } catch (recipeErr) {
              showError(recipeErr);
              showToast('تم إضافة المنتج لكن تعذّر حفظ الوصفة (الخامات)', 'info');
            }
          } else {
            showToast('تمت إضافة المنتج بنجاح');
          }
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
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

    let matchesStock = true;
    if (stockFilter === 'in') matchesStock = p.stockQuantity > 0;
    if (stockFilter === 'out') matchesStock = p.stockQuantity <= 0;

    return matchesCat && matchesSearch && matchesStock;
  });

  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
            قائمة المنتجات (Menu Catalog)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            إدارة قائمة المشروبات والمأكولات، الأسعار، وحالة التوفر في المخزن.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAddModal}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4 ml-1.5" />}
            className="bg-[#2e5b9f] hover:bg-[#244b85]"
          >
            إضافة منتج جديد
          </Button>
          <Button
            onClick={() => {
              setCategoryErrors({});
              setCategoryForm({ name: '', description: '' });
              setIsCategoryModalOpen(true);
            }}
            variant="outline"
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            تصنيف جديد
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الوصف — مثال: كابتشينو، كرواسون"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFilterDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200/60 rounded-xl text-xs font-bold text-gray-700 hover:bg-[#faf8f5] transition cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" />
              تصفية متقدمة
            </button>

            {(activeCategory !== 'all' || stockFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={handleFilterReset}
                className="flex items-center justify-center gap-1 py-2 px-3 border border-gray-200/60 rounded-xl text-xs font-bold text-rose-600 hover:bg-[#fff5f5] transition cursor-pointer"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" /> الحالة:
          </span>
          <button
            onClick={() => setStockFilter('all')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            الكل ({products.length})
          </button>
          <button
            onClick={() => setStockFilter('in')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'in'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            متوفر ({inStockCount})
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'out'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            نافد ({outOfStockCount})
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveCategory('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#2e5b9f] text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat._id
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <span className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200 px-2.5 py-1 rounded-xl font-bold font-mono">
            {filteredProducts.length} منتج معروض
          </span>
          <h3 className="font-bold text-base text-gray-900">قائمة المنتجات</h3>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={8} />
) : filteredProducts.length === 0 ? (
          <div className="text-center py-14 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
            <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
              <Coffee className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-bold text-sm">لا توجد منتجات مطابقة</p>
            <p className="text-xs text-gray-500 mt-2">جرّب كلمة بحث أخرى أو امسح الفلاتر لعرض كل المنتجات.</p>
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card Layout (< md) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {filteredProducts.map((prod) => {
                const catName =
                  typeof prod.category === 'object' ? prod.category.name : 'عام';
                return (
                  <div
                    key={prod._id}
                    onClick={() => handleViewProduct(prod)}
                    className="bg-[#faf8f5]/50 border border-gray-200/60 rounded-2xl p-4 space-y-3 cursor-pointer hover:shadow-2xs transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImageUrl(prod.image)}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">{prod.name}</span>
                          <span className="inline-flex mt-1 py-0.5 px-2 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                            {catName}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          prod.stockQuantity > 10
                            ? 'available'
                            : prod.stockQuantity > 0
                            ? 'low'
                            : 'out'
                        }
                        size="sm"
                      >
                        {prod.stockQuantity > 10
                          ? 'متوفر'
                          : prod.stockQuantity > 0
                          ? 'منخفض'
                          : 'نفذ'}
                      </Badge>
                    </div>

                    {prod.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2">
                        {prod.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">السعر</span>
                        <span className="font-bold text-[#2e5b9f] font-mono text-sm">
                          {formatPrice(prod.price)}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-gray-400 block mb-0.5">المخزون المتاح</span>
                        <span className="font-bold text-gray-700 font-mono">
                          {formatNumber(prod.stockQuantity)} وحدة
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/50" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewProduct(prod)}
                        className="p-1.5 text-gray-400 hover:text-[#2e5b9f] hover:bg-blue-50 rounded-lg transition"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 text-gray-400 hover:text-[#2e5b9f] hover:bg-blue-50 rounded-lg transition"
                        title="تعديل المنتج"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: prod._id, name: prod.name })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout (>= md) */}
            <div className="hidden md:block overflow-x-auto -mx-6 px-6 pb-2">
              <table className="w-full text-right border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-3 px-3">المنتج</th>
                    <th className="pb-3 px-3">التصنيف</th>
                    <th className="pb-3 px-3">السعر</th>
                    <th className="pb-3 px-3">المخزون المتاح</th>
                    <th className="pb-3 px-3">حالة التوفر</th>
                    <th className="pb-3 px-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredProducts.map((prod) => {
                    const catName =
                      typeof prod.category === 'object' ? prod.category.name : 'عام';
                    return (
                      <tr
                        key={prod._id}
                        className="hover:bg-[#faf8f5]/60 transition cursor-pointer"
                        onClick={() => handleViewProduct(prod)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(prod.image)}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
                              }}
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">{prod.name}</span>
                              {prod.description && (
                                <span className="text-[11px] text-gray-400 truncate max-w-xs block">
                                  {prod.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex py-1 px-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg text-[11px]">
                            {catName}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-bold font-mono text-sm text-[#2e5b9f]">
                          {formatPrice(prod.price)}
                        </td>

                        <td className="py-3 px-3 font-mono font-medium text-gray-700">
                          {formatNumber(prod.stockQuantity)} وحدة
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              prod.stockQuantity > 10
                                ? 'available'
                                : prod.stockQuantity > 0
                                ? 'low'
                                : 'out'
                            }
                            size="sm"
                          >
                            {prod.stockQuantity > 10
                              ? 'متوفر'
                              : prod.stockQuantity > 0
                              ? 'منخفض'
                              : 'نفذ المخزون'}
                          </Badge>
                        </td>

                        <td className="py-3 px-3 text-left" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewProduct(prod)}
                              className="p-1.5 text-gray-400 hover:text-[#2e5b9f] hover:bg-blue-50 rounded-lg transition"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-1.5 text-gray-400 hover:text-[#2e5b9f] hover:bg-blue-50 rounded-lg transition"
                              title="تعديل المنتج"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: prod._id, name: prod.name })}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* View Product Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="تفاصيل المنتج"
        maxWidth="md"
      >
        {viewingProduct && (
          <div className="space-y-4 text-right font-sans">
            <div className="flex items-center gap-4 p-4 bg-[#faf8f5] rounded-2xl border border-gray-100">
              <img
                src={getProductImageUrl(viewingProduct.image)}
                alt={viewingProduct.name}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-2xs"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';
                }}
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{viewingProduct.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{viewingProduct.description || 'لا يوجد وصف'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">السعر</span>
                <span className="text-lg font-bold font-mono text-[#2e5b9f]">{formatPrice(viewingProduct.price)}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">المخزون (يدوي)</span>
                <span className="text-lg font-bold font-mono text-gray-900">{formatNumber(viewingProduct.stockQuantity)} وحدة</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">المتاح من الوصفة</span>
                <span className="text-lg font-bold font-mono text-[#2e5b9f]">
                  {recipeData?.availableProductQty !== undefined ? `${formatNumber(recipeData.availableProductQty)} وحدة` : '—'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">التصنيف</span>
                <span className="text-sm font-bold text-gray-900">
                  {typeof viewingProduct.category === 'object' ? viewingProduct.category.name : 'عام'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">الحالة</span>
                <Badge
                  variant={
                    (recipeData?.availableProductQty ?? viewingProduct.stockQuantity) > 10
                      ? 'available'
                      : (recipeData?.availableProductQty ?? viewingProduct.stockQuantity) > 0
                      ? 'low'
                      : 'out'
                  }
                  size="sm"
                >
                  {(recipeData?.availableProductQty ?? viewingProduct.stockQuantity) > 10
                    ? 'متوفر'
                    : (recipeData?.availableProductQty ?? viewingProduct.stockQuantity) > 0
                    ? 'منخفض'
                    : 'نفذ المخزون'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                إغلاق
              </Button>
              <Button
                type="button"
                variant="primary"
                className="bg-[#2e5b9f]"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewingProduct);
                }}
              >
                تعديل المنتج
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        maxWidth="md"
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4 text-right">
          <Input
            label="اسم المنتج *"
            placeholder="مثال: كابتشينو، كولد برو..."
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
            }}
            error={formErrors.name}
            required
            isSubmitted={isFormSubmitted}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="السعر (ج.م) *"
              type="number"
              min="0"
              placeholder="185"
              value={formData.price}
              onChange={(e) => {
                setFormData({ ...formData, price: e.target.value });
                if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
              }}
              error={formErrors.price}
              required
              isSubmitted={isFormSubmitted}
            />

            <Select
              label="التصنيف *"
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value });
                if (formErrors.category) setFormErrors({ ...formErrors, category: undefined });
              }}
              error={formErrors.category}
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
          </div>

          <Input
            label={recipeRows.length > 0 ? "كمية المخزون المتاحة * (محسوبة تلقائياً)" : "كمية المخزون المتاحة *"}
            type="number"
            min="0"
            placeholder="30"
            disabled={recipeRows.length > 0}
            className={recipeRows.length > 0 ? "bg-gray-100 cursor-not-allowed font-bold" : ""}
            value={formData.stockQuantity}
            onChange={(e) => {
              if (recipeRows.length > 0) return; // double guard
              setFormData({ ...formData, stockQuantity: e.target.value });
              if (formErrors.stockQuantity) setFormErrors({ ...formErrors, stockQuantity: undefined });
            }}
            error={formErrors.stockQuantity}
            helperText={
              (() => {
                const backendAvailable = recipeData?.availableProductQty;
                const frontendAvailable = computedAvailable;
                if (recipeRows.length > 0) {
                  return `🔒 هذا الحقل مغلق ومحمي. يتم حساب كمية الإنتاج المتاحة تلقائياً (${frontendAvailable !== null ? frontendAvailable : 0} كوب) بناءً على أرصدة خامات المخزن الحالية.`;
                }
                return 'اربط خامات المخزون بالأسفل لحساب الكمية تلقائياً من الخامات، أو اكتب الرصيد يدوياً للمنتجات الجاهزة.';
              })()
            }
            required
          />

{/* Recipe / Raw-material linking (auto stock calculation from inventory) */}
          <div className="rounded-xl border border-[#2e5b9f]/30 bg-blue-50/60 p-4 text-right space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#2e5b9f]" />
                <span className="text-xs font-bold text-[#2e5b9f]">
                  ربط خامات المخزون (حساب الكمية تلقائياً)
                </span>
              </div>
              {(computedAvailable !== null || (recipeData?.availableProductQty !== undefined && recipeData?.availableProductQty !== null)) && (
                <button
                  type="button"
                  onClick={() => {
                    const qty = recipeData?.availableProductQty !== undefined && recipeData?.availableProductQty !== null
                      ? recipeData.availableProductQty
                      : computedAvailable;
                    setFormData((prev) => ({ ...prev, stockQuantity: String(qty) }));
                    if (formErrors.stockQuantity) setFormErrors({ ...formErrors, stockQuantity: undefined });
                  }}
                  className="inline-flex items-center gap-1 text-[#2e5b9f] font-bold text-[11px] hover:underline cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>تطبيق الكمية المحسوبة ({recipeData?.availableProductQty !== undefined && recipeData?.availableProductQty !== null ? recipeData.availableProductQty : computedAvailable})</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              مثال: لو اخترت خامة "حليب" برصيد ٢٠ لتر وكان استهلاك الكوب ٠.٢ لتر، فستكون الكمية المتاحة ١٠٠ كوب.
            </p>

            {recipeRows.map((row, idx) => {
              return (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <Select
                    label="الخامة من المخزون"
                    value={row.inventoryItem}
                    onChange={(e) => handleRecipeRowChange(idx, 'inventoryItem', e.target.value)}
                    options={inventoryItems.map((i) => ({
                      value: i._id,
                      label: `${i.name} (رصيد ${i.quantity} ${i.unit})`,
                    }))}
                  />
                  <Input
                    label="الاستهلاك للوحدة"
                    type="number"
                    min="0.001"
                    step="any"
                    placeholder="0.2"
                    value={row.consumeQty}
                    onChange={(e) => handleRecipeRowChange(idx, 'consumeQty', e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      وحدة الاستهلاك
                    </label>
                    <select
                      value={row.consumeUnit}
                      onChange={(e) => handleRecipeRowChange(idx, 'consumeUnit', e.target.value)}
                      className="w-full bg-[#faf8f5] focus:bg-white focus:border-[#2e5b9f] border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:outline-none"
                    >
                      {['KG', 'GRAM', 'LITER', 'ML', 'PIECE'].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removeRecipeRow(idx)}
                      className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] hover:underline cursor-pointer p-2"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {recipeErrors.row && (
              <p className="text-[11px] text-rose-600 font-bold">{recipeErrors.row}</p>
            )}

            {inventoryItems.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                لا توجد خامات في المخزون بعد. أضف خامات من صفحة المخزون أولاً لتفعيل الحساب التلقائي.
              </p>
            ) : (
              <button
                type="button"
                onClick={addRecipeRow}
                className="inline-flex items-center gap-1.5 border border-dashed border-[#2e5b9f]/40 text-[#2e5b9f] font-bold text-xs py-2 px-4 rounded-xl hover:bg-blue-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خامة من المخزون</span>
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              الوصف والمكونات
            </label>
            <textarea
              rows={2}
              placeholder="وصف مختصر للمنتج يظهر في المنيو..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${formErrors.imageFile && isFormSubmitted ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
              صورة المنتج (JPG / PNG) *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setFormData({ ...formData, imageFile: e.target.files ? e.target.files[0] : null });
                if (formErrors.imageFile) setFormErrors({ ...formErrors, imageFile: undefined });
              }}
              className={`w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2e5b9f] hover:file:bg-blue-100 cursor-pointer p-2 rounded-xl border ${formErrors.imageFile && isFormSubmitted ? 'border-rose-500 bg-rose-50/30' : 'border-gray-100'}`}
            />
            {formErrors.imageFile && isFormSubmitted && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">⚠️ {formErrors.imageFile}</p>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#2e5b9f]"
            >
              {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setIsCategoryFormSubmitted(false);
        }}
        title="إضافة تصنيف جديد"
        maxWidth="sm"
      >
        <form noValidate onSubmit={handleCreateCategory} className="space-y-4 text-right">
          <Input
            label="اسم التصنيف *"
            placeholder="مثال: مشروبات ساخنة، حلويات، شيشة..."
            value={categoryForm.name}
            onChange={(e) => {
              setCategoryForm({ ...categoryForm, name: e.target.value });
              if (categoryErrors.name) setCategoryErrors({ ...categoryErrors, name: undefined });
            }}
            error={categoryErrors.name}
            required
            autoFocus
            isSubmitted={isCategoryFormSubmitted}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              الوصف (اختياري)
            </label>
            <textarea
              rows={2}
              placeholder="وصف مختصر للتصنيف..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isAddingCategory}
              className="bg-[#2e5b9f]"
            >
              إضافة التصنيف
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف المنتج "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        config={filterDialogConfig}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </div>
  );
};