import { Category, Product, InventoryItem, Recipe, Order, Expense, User } from '../../types';

export const INITIAL_USERS: User[] = [
  {
    _id: 'usr_admin_001',
    userName: 'Sayed Herzallah (Admin)',
    email: 'admin@elfishawy.com',
    phone: '01011112222',
    address: 'خان الخليلي، الجمالية، القاهرة',
    roleType: 'admin',
    verify: true,
    createdAt: new Date('2024-01-01').toISOString(),
  },
  {
    _id: 'usr_cashier_001',
    userName: 'أحمد الكاشير (Ahmed)',
    email: 'cashier@elfishawy.com',
    phone: '01022223333',
    address: 'وسط البلد، القاهرة',
    roleType: 'cashier',
    verify: true,
    createdAt: new Date('2024-01-02').toISOString(),
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { _id: 'cat_coffee', name: 'القهوة', description: 'قهوة مختصة، إسبريسو، قهوة تركي ومقطرة' },
  { _id: 'cat_cold', name: 'المشروبات الباردة', description: 'كولد برو، آيس لاتيه، عصائر منعشة' },
  { _id: 'cat_bakery', name: 'المخبوزات', description: 'كرواسون طازج، كوكيز وسندوتشات' },
  { _id: 'cat_desserts', name: 'الحلويات', description: 'تشيز كيك، كيكة الليمون، وافل' },
  { _id: 'cat_hot', name: 'الشاي والأعشاب', description: 'شاي بالنعناع، شاي أعشاب، هوت شوكليت' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { _id: 'inv_beans_colombia', name: 'حبوب بن كولومبي - مغسول', quantity: 45, unit: 'KG', minLimit: 10, lastRestocked: '2023-10-25T10:00:00.000Z' },
  { _id: 'inv_beans_ethiopia', name: 'حبوب بن إثيوبي - مجفف', quantity: 22, unit: 'KG', minLimit: 5, lastRestocked: '2023-10-26T10:00:00.000Z' },
  { _id: 'inv_milk_fresh', name: 'حليب كامل الدسم', quantity: 38, unit: 'LITER', minLimit: 15, lastRestocked: '2023-10-25T08:30:00.000Z' },
  { _id: 'inv_oat_milk', name: 'حليب شوفان باريستا (Oat Milk)', quantity: 2, unit: 'LITER', minLimit: 8, lastRestocked: '2023-10-22T09:00:00.000Z' },
  { _id: 'inv_paper_cups_8oz', name: 'أكواب ورقية 8oz', quantity: 3, unit: 'PIECE', minLimit: 5, lastRestocked: '2023-10-24T11:00:00.000Z' },
  { _id: 'inv_croissant_dough', name: 'عجينة كرواسون زبدة', quantity: 60, unit: 'PIECE', minLimit: 20, lastRestocked: '2023-10-26T07:00:00.000Z' },
  { _id: 'inv_matcha_powder', name: 'بودرة ماتشا يابانية', quantity: 4, unit: 'KG', minLimit: 2, lastRestocked: '2023-10-20T14:00:00.000Z' },
  { _id: 'inv_mint_tea', name: 'أوراق نعناع مجفف فاخر', quantity: 12, unit: 'KG', minLimit: 3, lastRestocked: '2023-10-21T12:00:00.000Z' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    _id: 'prd_cappuccino',
    name: 'كابتشينو (House Cappuccino)',
    description: 'إسبريسو غني مع حليب مبخر ورغوة حليبية ناعمة 180ml',
    price: 185,
    category: 'cat_coffee',
    inStock: true,
    stockQuantity: 40,
    availableQuantityByRecipe: 38,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/cappuccino_01'
    }
  },
  {
    _id: 'prd_iced_latte',
    name: 'لاتيه مثلج (Iced Vanilla Latte)',
    description: 'إسبريسو مركز، حليب بارد مع فانيلا وسيروب طبيعي وثلج',
    price: 180,
    category: 'cat_cold',
    inStock: true,
    stockQuantity: 35,
    availableQuantityByRecipe: 35,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/iced_latte_01'
    }
  },
  {
    _id: 'prd_croissant_butter',
    name: 'كرواسون بالزبدة (Bakery Croissant)',
    description: 'مخبوز طازج يومياً بزبدة فرنسية طبيعية مقرمشة',
    price: 185,
    category: 'cat_bakery',
    inStock: true,
    stockQuantity: 25,
    availableQuantityByRecipe: 60,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/croissant_01'
    }
  },
  {
    _id: 'prd_croissant_almond',
    name: 'كرواسون لوز',
    description: 'كرواسون محشو بكريمة اللوز ومغطى بشرائح اللوز المحمص',
    price: 200,
    category: 'cat_bakery',
    inStock: false,
    stockQuantity: 0,
    availableQuantityByRecipe: 0,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/croissant_almond_01'
    }
  },
  {
    _id: 'prd_cold_brew',
    name: 'كولد برو منقوع 18 ساعة',
    description: 'قهوة باردة منقوعة ببطء لمدة 18 ساعة بنكهات فاكهية منعشة',
    price: 45,
    category: 'cat_cold',
    inStock: true,
    stockQuantity: 20,
    availableQuantityByRecipe: 30,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/cold_brew_01'
    }
  },
  {
    _id: 'prd_spanish_latte',
    name: 'آيسد إسباني (Iced Spanish)',
    description: 'إسبريسو دبل شوت مع حليب مكثف محلى وحليب طازج وثلج',
    price: 60,
    category: 'cat_cold',
    inStock: true,
    stockQuantity: 50,
    availableQuantityByRecipe: 45,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/spanish_latte_01'
    }
  },
  {
    _id: 'prd_cheesecake',
    name: 'تشيز كيك التوت',
    description: 'تشيز كيك نيويورك الكلاسيكي مع صوص التوت البري الطازج',
    price: 75,
    category: 'cat_desserts',
    inStock: true,
    stockQuantity: 15,
    availableQuantityByRecipe: 15,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/cheesecake_01'
    }
  },
  {
    _id: 'prd_mint_tea',
    name: 'شاي بالنعناع الفيشاوي',
    description: 'شاي أسود معتق مع أوراق النعناع البلدي الطازج في براد نحاسي',
    price: 40,
    category: 'cat_hot',
    inStock: true,
    stockQuantity: 100,
    availableQuantityByRecipe: 120,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/mint_tea_01'
    }
  },
  {
    _id: 'prd_turkish_coffee',
    name: 'قهوة تركي مخصوص (بوش)',
    description: 'بن محوج بحبهان ومستكة مطحون طازج ومطهو على الرمال الساخنة',
    price: 50,
    category: 'cat_coffee',
    inStock: true,
    stockQuantity: 80,
    availableQuantityByRecipe: 90,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/turkish_coffee_01'
    }
  },
  {
    _id: 'prd_orange_fresh',
    name: 'عصير برتقال طبيعي فريش',
    description: 'عصير برتقال بلدي معصور طازج بدون أي إضافات أو سكر',
    price: 65,
    category: 'cat_cold',
    inStock: true,
    stockQuantity: 40,
    availableQuantityByRecipe: 40,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/orange_juice_01'
    }
  },
  {
    _id: 'prd_brownies',
    name: 'براونيز فادج بلجيكي',
    description: 'قطعة براونيز غنية بشوكولاتة داكنة ذائبة وقطع المكسرات',
    price: 85,
    category: 'cat_desserts',
    inStock: true,
    stockQuantity: 20,
    availableQuantityByRecipe: 20,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/brownies_01'
    }
  },
  {
    _id: 'prd_karkadeh',
    name: 'كركديه أسواني مثلج',
    description: 'كركديه أسواني نقي منقوع على البارد ومحلى بالسكر الطبيعي',
    price: 45,
    category: 'cat_cold',
    inStock: true,
    stockQuantity: 60,
    availableQuantityByRecipe: 60,
    image: {
      secure_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
      public_id: 'elfishawy/karkadeh_01'
    }
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    _id: 'rcp_cappuccino',
    product: 'prd_cappuccino',
    ingredients: [
      { inventoryItem: 'inv_beans_colombia', inputQuantity: 1, inputUnit: 'KG', outputQuantity: 50, consumptionPerUnitInBase: 0.02, availableFromThisIngredient: 2250 },
      { inventoryItem: 'inv_milk_fresh', inputQuantity: 1, inputUnit: 'LITER', outputQuantity: 5, consumptionPerUnitInBase: 0.2, availableFromThisIngredient: 190 }
    ],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'rcp_iced_latte',
    product: 'prd_iced_latte',
    ingredients: [
      { inventoryItem: 'inv_beans_ethiopia', inputQuantity: 1, inputUnit: 'KG', outputQuantity: 50, consumptionPerUnitInBase: 0.02, availableFromThisIngredient: 1100 },
      { inventoryItem: 'inv_milk_fresh', inputQuantity: 1, inputUnit: 'LITER', outputQuantity: 4, consumptionPerUnitInBase: 0.25, availableFromThisIngredient: 152 }
    ],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'rcp_croissant_butter',
    product: 'prd_croissant_butter',
    ingredients: [
      { inventoryItem: 'inv_croissant_dough', inputQuantity: 1, inputUnit: 'PIECE', outputQuantity: 1, consumptionPerUnitInBase: 1, availableFromThisIngredient: 60 }
    ],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    _id: 'ord_1048',
    orderNumber: 'EFC-231024-1048',
    items: [
      { product: 'prd_cappuccino', quantity: 1, price: 185 },
      { product: 'prd_iced_latte', quantity: 2, price: 180 }
    ],
    totalAmount: 545,
    status: 'completed',
    paymentMethod: 'cash',
    orderType: 'dine-in',
    tableNumber: 4,
    cashierId: { _id: 'usr_cashier_001', userName: 'أحمد الكاشير (Ahmed)', email: 'cashier@elfishawy.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    _id: 'ord_1047',
    orderNumber: 'EFC-231024-1047',
    items: [
      { product: 'prd_croissant_butter', quantity: 1, price: 185 },
      { product: 'prd_cold_brew', quantity: 1, price: 45 }
    ],
    totalAmount: 230,
    status: 'completed',
    paymentMethod: 'card',
    orderType: 'takeaway',
    cashierId: { _id: 'usr_cashier_001', userName: 'سارة الكاشير (Sara)', email: 'sara@elfishawy.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    _id: 'ord_1046',
    orderNumber: 'EFC-231024-1046',
    items: [
      { product: 'prd_mint_tea', quantity: 2, price: 40 }
    ],
    totalAmount: 80,
    status: 'pending',
    paymentMethod: 'cash',
    orderType: 'dine-in',
    tableNumber: 8,
    cashierId: { _id: 'usr_cashier_001', userName: 'أحمد الكاشير (Ahmed)', email: 'cashier@elfishawy.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    _id: 'ord_1045',
    orderNumber: 'EFC-231024-1045',
    items: [
      { product: 'prd_spanish_latte', quantity: 2, price: 60 },
      { product: 'prd_cheesecake', quantity: 1, price: 75 }
    ],
    totalAmount: 195,
    status: 'completed',
    paymentMethod: 'card',
    orderType: 'dine-in',
    tableNumber: 2,
    cashierId: { _id: 'usr_cashier_001', userName: 'سارة الكاشير (Sara)', email: 'sara@elfishawy.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    _id: 'ord_1044',
    orderNumber: 'EFC-231024-1044',
    items: [
      { product: 'prd_cappuccino', quantity: 1, price: 185 }
    ],
    totalAmount: 185,
    status: 'cancelled',
    paymentMethod: 'cash',
    orderType: 'takeaway',
    cashierId: { _id: 'usr_cashier_001', userName: 'أحمد الكاشير (Ahmed)', email: 'cashier@elfishawy.com' },
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    _id: 'exp_001',
    description: 'شراء 20 كجم حبوب بن كولومبي فاخر',
    amount: 2500,
    category: 'inventory',
    inventoryItemLinked: 'inv_beans_colombia',
    inventoryQuantityAdded: 20,
    date: new Date('2023-10-25T10:00:00.000Z').toISOString(),
    addedBy: { _id: 'usr_admin_001', userName: 'Sayed Herzallah (Admin)', email: 'admin@elfishawy.com' }
  },
  {
    _id: 'exp_002',
    description: 'فاتورة الكهرباء والمياه - شهر أكتوبر',
    amount: 850,
    category: 'utilities',
    date: new Date('2023-10-24T14:30:00.000Z').toISOString(),
    addedBy: { _id: 'usr_admin_001', userName: 'Sayed Herzallah (Admin)', email: 'admin@elfishawy.com' }
  },
  {
    _id: 'exp_003',
    description: 'شراء مستلزمات نظافة وأكواب ورقية',
    amount: 350,
    category: 'other',
    date: new Date('2023-10-22T16:00:00.000Z').toISOString(),
    addedBy: { _id: 'usr_admin_001', userName: 'Sayed Herzallah (Admin)', email: 'admin@elfishawy.com' }
  },
  {
    _id: 'exp_004',
    description: 'رواتب طاقم الباريستا والكاشير - أسبوعي',
    amount: 5000,
    category: 'salaries',
    date: new Date('2023-10-20T12:00:00.000Z').toISOString(),
    addedBy: { _id: 'usr_admin_001', userName: 'Sayed Herzallah (Admin)', email: 'admin@elfishawy.com' }
  },
  {
    _id: 'exp_005',
    description: 'إيجار موقع المقهى الشهري',
    amount: 2000,
    category: 'rent',
    date: new Date('2023-10-01T09:00:00.000Z').toISOString(),
    addedBy: { _id: 'usr_admin_001', userName: 'Sayed Herzallah (Admin)', email: 'admin@elfishawy.com' }
  }
];
