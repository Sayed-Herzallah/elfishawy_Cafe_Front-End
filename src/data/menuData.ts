/**
 * منيو مقهى الفيشاوي — بيانات ثابتة (Static Data)
 * ---------------------------------------------------
 * الملف ده هو المصدر الوحيد لعرض المنيو العام للزوار.
 * لتعديل الأسعار أو إضافة/إزاحة صنف: عدّل هنا مباشرة — التغيير يظهر فورًا في صفحة المنيو.
 *
 * - كل صنف له تصنيف واحد من MENU_CATEGORIES.
 * - الصنف الواحد ممكن يكون له أكثر من نوع (Variants) مثل: سادة / زيادة / دبل، ولكل نوع سعره.
 * - isAvailable = false يخفي النوع أو الصنف من المنيو بدون حذفه.
 */

export interface MenuVariant {
  id: string;
  /** اسم النوع كما سيظهر للعميل: سادة، زيادة، دبل... */
  label: string;
  /** السعر بالجنيه المصري */
  price: number;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  /** الاسم الأساسي للصنف */
  name: string;
  description: string;
  image: string;
  categoryId: string;
  /** صنف مميز يظهر بشارة خاصة */
  isPopular?: boolean;
  variants: MenuVariant[];
}

/** صورة افتراضية تُستخدم لو فشل تحميل صورة أي صنف */
export const DEFAULT_MENU_IMAGE =
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop';

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'coffee', name: 'القهوة', icon: '☕', sortOrder: 1 },
  { id: 'tea-herbs', name: 'الشاي والأعشاب', icon: '🫖', sortOrder: 2 },
  { id: 'cold-drinks', name: 'المشروبات الباردة', icon: '🧊', sortOrder: 3 },
  { id: 'juices', name: 'العصائر الطازجة', icon: '🍹', sortOrder: 4 },
  { id: 'milkshakes', name: 'ميلك شيك وسموذي', icon: '🥤', sortOrder: 5 },
];

const img = (id: string) => `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

export const MENU_ITEMS: MenuItem[] = [
  // ==================== القهوة ====================
  {
    id: 'turkish-coffee',
    name: 'قهوة تركي',
    description: 'قهوة بلدي على الرمل، محضّرة على الطريقة التقليدية',
    image: img('photo-1514432324607-a09d9b4aefdd'),
    categoryId: 'coffee',
    isPopular: true,
    variants: [
      { id: 'turkish-plain', label: 'سادة', price: 20, isAvailable: true },
      { id: 'turkish-medium', label: 'مظبوط', price: 20, isAvailable: true },
      { id: 'turkish-sweet', label: 'زيادة', price: 22, isAvailable: true },
      { id: 'turkish-double', label: 'دبل', price: 32, isAvailable: true },
    ],
  },
  {
    id: 'espresso',
    name: 'إسبريسو',
    description: 'جرعة مركزة من حبوب القهوة المحمصة',
    image: img('photo-1510707577719-ae7c14805e3a'),
    categoryId: 'coffee',
    variants: [{ id: 'espresso-single', label: 'جرعة واحدة', price: 25, isAvailable: true }],
  },
  {
    id: 'americano',
    name: 'أمريكانو',
    description: 'إسبريسو مع ماء ساخن لمذاق خفيف ومتوازن',
    image: img('photo-1551030173-122aabc4489c'),
    categoryId: 'coffee',
    variants: [{ id: 'americano-regular', label: 'كوب', price: 30, isAvailable: true }],
  },
  {
    id: 'cappuccino',
    name: 'كابتشينو',
    description: 'إسبريسو مع الحليب المخفوق ورغوة كثيفة',
    image: img('photo-1572442388796-11668a67e53d'),
    categoryId: 'coffee',
    isPopular: true,
    variants: [{ id: 'cappuccino-regular', label: 'كوب', price: 40, isAvailable: true }],
  },
  {
    id: 'latte',
    name: 'لاتيه',
    description: 'قهوة بالحليب المخملي بطبقات متدرجة',
    image: img('photo-1561047029-3000c68339ca'),
    categoryId: 'coffee',
    variants: [{ id: 'latte-regular', label: 'كوب', price: 45, isAvailable: true }],
  },
  {
    id: 'mocha',
    name: 'موكا',
    description: 'خليط الشوكولاتة والقهوة مع الحليب',
    image: img('photo-1578314675249-a6910f80cc4e'),
    categoryId: 'coffee',
    variants: [{ id: 'mocha-regular', label: 'كوب', price: 50, isAvailable: true }],
  },
  {
    id: 'instant-coffee',
    name: 'نسكافيه',
    description: 'قهوة سريعة التحضير بالحليب أو السادة',
    image: img('photo-1497636577773-f1231844b336'),
    categoryId: 'coffee',
    variants: [
      { id: 'nescaf-milk', label: 'بالحليب', price: 35, isAvailable: true },
      { id: 'nescaf-black', label: 'سادة', price: 30, isAvailable: true },
    ],
  },

  // ==================== الشاي والأعشاب ====================
  {
    id: 'tea',
    name: 'شاي',
    description: 'شاي أحمر على الطريقة المصرية',
    image: img('photo-1544787219-7f47ccb76574'),
    categoryId: 'tea-herbs',
    isPopular: true,
    variants: [
      { id: 'tea-plain', label: 'سادة', price: 12, isAvailable: true },
      { id: 'tea-medium', label: 'مظبوط', price: 12, isAvailable: true },
      { id: 'tea-sweet', label: 'زيادة', price: 14, isAvailable: true },
      { id: 'tea-mint', label: 'بالنعناع', price: 16, isAvailable: true },
      { id: 'tea-milk', label: 'بالحليب', price: 20, isAvailable: true },
    ],
  },
  {
    id: 'honey-tea',
    name: 'شاي بالعسل',
    description: 'شاي أحمر محلاّ بعسل النحل الطبيعي',
    image: img('photo-1544787219-7f47ccb76574'),
    categoryId: 'tea-herbs',
    variants: [{ id: 'honey-tea-regular', label: 'كوب', price: 22, isAvailable: true }],
  },
  {
    id: 'hibiscus',
    name: 'كركديه',
    description: 'كركديه ساخن أو مثلج حسب الطلب',
    image: img('photo-1556679343-c7306c1976bc'),
    categoryId: 'tea-herbs',
    variants: [
      { id: 'hibiscus-hot', label: 'ساخن', price: 15, isAvailable: true },
      { id: 'hibiscus-cold', label: 'مثلج', price: 18, isAvailable: true },
    ],
  },
  {
    id: 'anise',
    name: 'ينسون',
    description: 'ينسون ساخن دافئ ومهدّئ',
    image: img('photo-1544787219-7f47ccb76574'),
    categoryId: 'tea-herbs',
    variants: [{ id: 'anise-regular', label: 'كوب', price: 15, isAvailable: true }],
  },
  {
    id: 'chamomile',
    name: 'بابونج',
    description: 'أعشاب بابونج طبيعية',
    image: img('photo-1544787219-7f47ccb76574'),
    categoryId: 'tea-herbs',
    variants: [{ id: 'chamomile-regular', label: 'كوب', price: 15, isAvailable: true }],
  },

  // ==================== المشروبات الباردة ====================
  {
    id: 'iced-coffee',
    name: 'آيس كوفي',
    description: 'قهوة باردة بالمثلجات والحليب',
    image: img('photo-1461023058943-07fcbe16d735'),
    categoryId: 'cold-drinks',
    variants: [{ id: 'iced-coffee-regular', label: 'كوب', price: 45, isAvailable: true }],
  },
  {
    id: 'iced-latte',
    name: 'آيس لاتيه',
    description: 'لاتيه بارد بطبقات الحليب والثلج',
    image: img('photo-1461023058943-07fcbe16d735'),
    categoryId: 'cold-drinks',
    variants: [{ id: 'iced-latte-regular', label: 'كوب', price: 50, isAvailable: true }],
  },
  {
    id: 'frappe',
    name: 'فرابيه',
    description: 'قهوة مخفوقة بالثلج مع الكريمة',
    image: img('photo-1534040385115-33dcb3acba5b'),
    categoryId: 'cold-drinks',
    variants: [{ id: 'frappe-regular', label: 'كوب', price: 55, isAvailable: true }],
  },
  {
    id: 'iced-tea',
    name: 'آيس تي',
    description: 'شاي مثلج بالليمون المنعش',
    image: img('photo-1556679343-c7306c1976bc'),
    categoryId: 'cold-drinks',
    variants: [{ id: 'iced-tea-regular', label: 'كوب', price: 25, isAvailable: true }],
  },

  // ==================== العصائر الطازجة ====================
  {
    id: 'sugarcane',
    name: 'عصير قصب',
    description: 'قصب طازج يُعصر عند الطلب',
    image: img('photo-1499638673689-79a0b5115d87'),
    categoryId: 'juices',
    isPopular: true,
    variants: [
      { id: 'sugarcane-regular', label: 'كوب', price: 20, isAvailable: true },
      { id: 'sugarcane-lemon', label: 'بالليمون', price: 22, isAvailable: true },
    ],
  },
  {
    id: 'orange-juice',
    name: 'عصير برتقال',
    description: 'برتقال بلدي طازج 100%',
    image: img('photo-1553530666-ba11a7da3888'),
    categoryId: 'juices',
    variants: [{ id: 'orange-regular', label: 'كوب', price: 25, isAvailable: true }],
  },
  {
    id: 'lemon-juice',
    name: 'عصير ليمون',
    description: 'ليمون طازج بالنعناع',
    image: img('photo-1523677011781-c91d1bbe2f9e'),
    categoryId: 'juices',
    variants: [{ id: 'lemon-regular', label: 'كوب', price: 22, isAvailable: true }],
  },
  {
    id: 'mango-juice',
    name: 'عصير مانجو',
    description: 'مانجو بلدي طبيعي بدون سكر مضاف',
    image: img('photo-1579954115545-a95591f28bfc'),
    categoryId: 'juices',
    variants: [{ id: 'mango-regular', label: 'كوب', price: 35, isAvailable: true }],
  },

  // ==================== ميلك شيك وسموذي ====================
  {
    id: 'milkshake-chocolate',
    name: 'ميلك شيك شوكولاتة',
    description: 'حليب مخفوق بالشوكولاتة والآيس كريم',
    image: img('photo-1572490122747-3968b75cc699'),
    categoryId: 'milkshakes',
    isPopular: true,
    variants: [{ id: 'shake-chocolate', label: 'كوب كبير', price: 45, isAvailable: true }],
  },
  {
    id: 'milkshake-vanilla',
    name: 'ميلك شيك فانيليا',
    description: 'حليب مخفوق بالفانيليا والآيس كريم',
    image: img('photo-1572490122747-3968b75cc699'),
    categoryId: 'milkshakes',
    variants: [{ id: 'shake-vanilla', label: 'كوب كبير', price: 45, isAvailable: true }],
  },
  {
    id: 'milkshake-strawberry',
    name: 'ميلك شيك فراولة',
    description: 'حليب مخفوق بالفراولة الطازجة',
    image: img('photo-1572490122747-3968b75cc699'),
    categoryId: 'milkshakes',
    variants: [{ id: 'shake-strawberry', label: 'كوب كبير', price: 48, isAvailable: true }],
  },
  {
    id: 'mango-smoothie',
    name: 'سموذي مانجو',
    description: 'مانجو طازج مع الزبادي والعسل',
    image: img('photo-1579954115545-a95591f28bfc'),
    categoryId: 'milkshakes',
    variants: [{ id: 'smoothie-mango', label: 'كوب كبير', price: 50, isAvailable: true }],
  },
];

// ===================== دوال مساعدة للقراءة والفلترة =====================

export const getSortedCategories = (): MenuCategory[] =>
  [...MENU_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);

export const getCategoryById = (categoryId: string): MenuCategory | undefined =>
  MENU_CATEGORIES.find((cat) => cat.id === categoryId);

export const getAvailableItems = (): MenuItem[] => MENU_ITEMS.filter((item) => item.variants.some((v) => v.isAvailable));

export interface MenuFilterOptions {
  categoryId?: string;
  searchQuery?: string;
}

export const filterMenuItems = ({ categoryId, searchQuery }: MenuFilterOptions): MenuItem[] => {
  const query = (searchQuery || '').trim().toLowerCase();

  return getAvailableItems().filter((item) => {
    const matchesCategory = !categoryId || categoryId === 'all' || item.categoryId === categoryId;
    if (!matchesCategory) return false;

    if (!query) return true;

    const haystacks = [item.name, item.description, ...item.variants.map((v) => v.label)];
    return haystacks.some((text) => String(text || '').toLowerCase().includes(query));
  });
};

/** أقل سعر وأعلى سعر متاحين للصنف (لو فيه أنواع بأكثر من سعر) */
export const getItemPriceRange = (item: MenuItem): { min: number; max: number } => {
  const prices = item.variants.filter((v) => v.isAvailable).map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};
