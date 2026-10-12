import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  IceCream,
  Search,
  ChevronRight,
  Smartphone,
  Split,
  X,
  Edit,
  Eye,
  Receipt,
  Users,
  Lock,
  LogOut,
  Shield,
  UserCircle,
  Tag,
  Printer,
  Sliders,
  FolderPlus,
  Cloud,
  Database,
  AlertTriangle,
  RefreshCw,
  Coins,
  Store,
  MonitorCheck,
  History,
  DollarSign,
  Check,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, CartItem, SaleReport, User, Promotion, TransactionDetail, SaleFullDetail, Expense, AppSettings, PosPoint, CashShift } from './types';
import { SettingsView } from './components/SettingsView';
import { NewCategoryModal } from './components/NewCategoryModal';

const defaultSettingsState: AppSettings = {
  business_name: "Chuly Helados",
  business_subtitle: "Punto de Venta",
  business_address: "Av. San Martín 450",
  business_phone: "+54 9 11 4567-8900",
  currency_symbol: "$",
  low_stock_threshold: 10,
  tax_info: "IVA Responsable Inscripto",
  paper_width: "80mm",
  auto_print: true,
  ticket_copies: 1,
  printer_target_notes: "Impresora Térmica Predeterminada (USB / Red / Default)",
  show_logo: true,
  logo_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=200&auto=format&fit=crop&q=80",
  header_title: "Chuly Helados",
  header_subtitle: "Punto de Venta - Comanda",
  footer_message: "¡Muchas gracias por elegirnos!",
  show_seller: true,
  show_payment_details: true,
  font_family: "mono",
  font_size: "normal",
  font_weight: "normal",
  line_spacing: "normal"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'users' | 'settings'>('pos');
  const [settings, setSettings] = useState<AppSettings>(defaultSettingsState);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reports, setReports] = useState<{ sales: SaleReport[], expenses: number, revenue: number, cost: number }>({ sales: [], expenses: 0, revenue: 0, cost: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [userForm, setUserForm] = useState({
    name: '',
    role: 'empleado' as 'admin' | 'empleado',
    password: ''
  });
  const [promotionForm, setPromotionForm] = useState({
    product_id: 0,
    quantity_threshold: 2,
    promo_price: 0
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: 0,
    payment_method: 'Efectivo'
  });
  const [splitAmounts, setSplitAmounts] = useState<{ [key: string]: number }>({
    'Efectivo': 0,
    'Tarjeta': 0,
    'Transferencia': 0
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);
  const [transactionViewMode, setTransactionViewMode] = useState<'sales' | 'items'>('sales');
  const [viewingSale, setViewingSale] = useState<SaleFullDetail | null>(null);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleFullDetail | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const [saleEditError, setSaleEditError] = useState<string | null>(null);
  const [addProductToSaleId, setAddProductToSaleId] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reportRange, setReportRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [lastSale, setLastSale] = useState<{
    items: CartItem[];
    total: number;
    payments: { method: string; amount: number }[];
    date: string;
  } | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    category_id: 1,
    unit: 'un'
  });

  // Cash Register (Caja) & POS Point State
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showCashSummaryTicketModal, setShowCashSummaryTicketModal] = useState(false);
  const [closedShiftSummary, setClosedShiftSummary] = useState<CashShift | null>(null);
  const [posPoints, setPosPoints] = useState<PosPoint[]>([]);
  const [selectedPosPointId, setSelectedPosPointId] = useState<number | ''>('');
  const [initialCashInput, setInitialCashInput] = useState<string>('0');
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [cashNotesInput, setCashNotesInput] = useState<string>('');
  const [cashError, setCashError] = useState<string | null>(null);
  const [isCashSubmitting, setIsCashSubmitting] = useState(false);
  const [cashShiftsHistory, setCashShiftsHistory] = useState<CashShift[]>([]);
  const [showCashHistoryModal, setShowCashHistoryModal] = useState(false);
  const [printMode, setPrintMode] = useState<'sale' | 'shift'>('sale');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const loginPasswordInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showSuccess && lastSale && settings.auto_print) {
      // Small delay to ensure DOM is ready, but short enough for mobile browsers
      const timer = setTimeout(() => {
        handlePrint();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, lastSale, settings.auto_print]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, userRes, promoRes, expRes, setRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/users'),
        fetch('/api/promotions'),
        fetch('/api/expenses'),
        fetch('/api/settings')
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
      setUsers(await userRes.json());
      setPromotions(await promoRes.json());
      setExpenses(await expRes.json());
      if (setRes.ok) {
        const setObj = await setRes.json();
        setSettings(prev => ({ ...prev, ...setObj }));
      }
      await fetchCurrentShift();
      fetchReports();
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const [shiftRes, posRes] = await Promise.all([
        fetch('/api/cash-shift/current'),
        fetch('/api/pos-points')
      ]);
      if (shiftRes.ok) {
        const data = await shiftRes.json();
        setIsCashOpen(Boolean(data.isOpen));
        setCurrentShift(data.shift || null);
      }
      if (posRes.ok) {
        const posData: PosPoint[] = await posRes.json();
        setPosPoints(posData);
        if (posData.length > 0) {
          const activePos = posData.find(p => p.active) || posData[0];
          setSelectedPosPointId(prev => prev ? prev : activePos.id);
        }
      }
    } catch (e) {
      console.error('Error fetching cash shift:', e);
    }
  };

  const fetchCashShiftsHistory = async () => {
    try {
      const res = await fetch('/api/cash-shifts');
      if (res.ok) {
        const data = await res.json();
        setCashShiftsHistory(data);
      }
    } catch (e) {
      console.error('Error fetching cash shifts history:', e);
    }
  };

  const handleOpenOpenCashModal = async () => {
    setCashError(null);
    setInitialCashInput('0');
    setCashNotesInput('');
    await fetchCurrentShift();
    setShowOpenCashModal(true);
  };

  const handleOpenCloseCashModal = async () => {
    setCashError(null);
    setCountedCashInput('');
    setCashNotesInput('');
    await fetchCurrentShift();
    setShowCloseCashModal(true);
  };

  const handleConfirmOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCashSubmitting(true);
    setCashError(null);
    try {
      const initialNum = parseFloat(initialCashInput) || 0;
      const res = await fetch('/api/cash-shift/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_cash: initialNum,
          pos_point_id: selectedPosPointId || null,
          user_id: currentUser?.id,
          notes: cashNotesInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al abrir caja');
      }
      setIsCashOpen(true);
      setCurrentShift(data.shift);
      setShowOpenCashModal(false);
    } catch (err: any) {
      setCashError(err.message || 'Error al abrir la caja');
    } finally {
      setIsCashSubmitting(false);
    }
  };

  const handleConfirmCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    setIsCashSubmitting(true);
    setCashError(null);
    try {
      const countedNum = countedCashInput === '' ? (currentShift.expected_cash || 0) : parseFloat(countedCashInput) || 0;
      const res = await fetch('/api/cash-shift/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: currentShift.id,
          final_cash: countedNum,
          notes: cashNotesInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cerrar caja');
      }
      setClosedShiftSummary(data.shift);
      setIsCashOpen(false);
      setCurrentShift(null);
      setShowCloseCashModal(false);
      setShowCashSummaryTicketModal(true);
      await fetchReports();
    } catch (err: any) {
      setCashError(err.message || 'Error al cerrar la caja');
    } finally {
      setIsCashSubmitting(false);
    }
  };

  const handlePrintShiftTicket = (shift: CashShift) => {
    setClosedShiftSummary(shift);
    setPrintMode('shift');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const fetchReports = async () => {
    try {
      const [repRes, expRes] = await Promise.all([
        fetch(`/api/reports/range?start=${reportRange.start}&end=${reportRange.end}`),
        fetch(`/api/expenses?start=${reportRange.start}&end=${reportRange.end}`)
      ]);
      
      if (repRes.ok) setReports(await repRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [reportRange, activeTab]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && activeTab !== 'pos') {
        setActiveTab('pos');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  useEffect(() => {
    if (showLoginModal && users.length > 0 && !loginForm.name) {
      setLoginForm(prev => ({ ...prev, name: users[0].name }));
      setTimeout(() => {
        loginPasswordInputRef.current?.focus();
      }, 100);
    }
  }, [showLoginModal, users]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const user = users.find(u => u.name === loginForm.name && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setShowLoginModal(false);
      setLoginForm({ name: '', password: '' });
      setLoginError(null);
      fetchCurrentShift();
    } else {
      setLoginError('Usuario o contraseña incorrectos. Verifica tus datos.');
      setTimeout(() => {
        loginPasswordInputRef.current?.focus();
        loginPasswordInputRef.current?.select();
      }, 50);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLoginModal(true);
    setLoginError(null);
    setActiveTab('pos');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ name: '', role: 'empleado', password: '' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      role: user.role,
      password: user.password || ''
    });
    setShowUserModal(true);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm)
      });
      if (res.ok) {
        setPromotionForm({ product_id: 0, quantity_threshold: 2, promo_price: 0 });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    const promo = promotions.find(p => p.product_id === item.id);
    if (promo && item.quantity >= promo.quantity_threshold) {
      const promoSets = Math.floor(item.quantity / promo.quantity_threshold);
      const remaining = item.quantity % promo.quantity_threshold;
      return (promoSets * promo.promo_price) + (remaining * item.price);
    }
    return item.price * item.quantity;
  };

  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const fetchTransactionDetails = async () => {
    try {
      const res = await fetch(`/api/reports/transactions?start=${reportRange.start}&end=${reportRange.end}`);
      const data = await res.json();
      setTransactionDetails(data);
      setShowTransactionModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const groupedTransactions = React.useMemo(() => {
    const map = new Map<number, {
      sale_id: number;
      created_at: string;
      seller_name: string;
      payment_method: string;
      sale_total: number;
      items: { product_name: string; quantity: number; subtotal: number }[];
    }>();

    for (const t of transactionDetails) {
      if (!map.has(t.sale_id)) {
        map.set(t.sale_id, {
          sale_id: t.sale_id,
          created_at: t.created_at,
          seller_name: t.seller_name || 'Desconocido',
          payment_method: t.payment_method || 'Efectivo',
          sale_total: t.sale_total ?? t.subtotal,
          items: []
        });
      }
      const s = map.get(t.sale_id)!;
      s.items.push({
        product_name: t.product_name,
        quantity: t.quantity,
        subtotal: t.subtotal
      });
    }
    return Array.from(map.values());
  }, [transactionDetails]);

  const handleOpenSaleDetail = async (saleId: number) => {
    setIsLoadingSale(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (!res.ok) throw new Error('No se pudo cargar la transacción');
      const data: SaleFullDetail = await res.json();
      setViewingSale(data);
      setShowSaleDetailModal(true);
    } catch (err: any) {
      console.error('Error al obtener detalles de la venta:', err);
    } finally {
      setIsLoadingSale(false);
    }
  };

  const handlePrintSaleReceipt = (sale: SaleFullDetail) => {
    setLastSale({
      items: sale.items.map(it => ({
        id: it.product_id,
        name: it.product_name,
        category_id: 0,
        category_name: '',
        cost: 0,
        price: it.price,
        stock_quantity: 0,
        unit: it.unit || 'un',
        quantity: it.quantity
      })),
      total: sale.total,
      payments: sale.payments.map(p => ({ method: p.method, amount: p.amount })),
      date: new Date(sale.created_at).toLocaleString()
    });
    setPrintMode('sale');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenEditSale = async (saleId: number) => {
    setIsLoadingSale(true);
    setSaleEditError(null);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (!res.ok) throw new Error('No se pudo cargar la transacción');
      const data: SaleFullDetail = await res.json();
      setEditingSale(data);
      setShowEditSaleModal(true);
    } catch (err: any) {
      console.error('Error al abrir edición de venta:', err);
      setSaleEditError(err.message || 'Error al obtener la transacción');
    } finally {
      setIsLoadingSale(false);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (!editingSale) return;
    if (newQty <= 0) {
      handleRemoveItemFromSale(index);
      return;
    }
    const updatedItems = [...editingSale.items];
    const item = updatedItems[index];
    const unitPrice = item.price || (item.quantity > 0 ? item.subtotal / item.quantity : 0);
    updatedItems[index] = {
      ...item,
      quantity: newQty,
      subtotal: Math.round(newQty * unitPrice)
    };
    
    const newTotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);
    setEditingSale({
      ...editingSale,
      items: updatedItems,
      total: newTotal
    });
  };

  const handleRemoveItemFromSale = (index: number) => {
    if (!editingSale) return;
    const updatedItems = editingSale.items.filter((_, idx) => idx !== index);
    const newTotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);
    setEditingSale({
      ...editingSale,
      items: updatedItems,
      total: newTotal
    });
  };

  const handleAddProductToSale = (productId: number) => {
    if (!editingSale || !productId) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const existingIdx = editingSale.items.findIndex(it => it.product_id === productId);
    if (existingIdx >= 0) {
      handleUpdateItemQuantity(existingIdx, editingSale.items[existingIdx].quantity + 1);
    } else {
      const newItem = {
        id: 0,
        product_id: prod.id,
        product_name: prod.name,
        quantity: 1,
        price: prod.price,
        subtotal: prod.price,
        unit: prod.unit
      };
      const updatedItems = [...editingSale.items, newItem];
      const newTotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);
      setEditingSale({
        ...editingSale,
        items: updatedItems,
        total: newTotal
      });
    }
    setAddProductToSaleId(0);
  };

  const handleAutoAdjustPayments = () => {
    if (!editingSale) return;
    const currentMethods = editingSale.payments.length > 0 
      ? [...editingSale.payments] 
      : [{ method: 'Efectivo', amount: editingSale.total }];

    if (currentMethods.length === 1) {
      setEditingSale({
        ...editingSale,
        payments: [{ ...currentMethods[0], amount: editingSale.total }]
      });
    } else {
      const sumOthers = currentMethods.slice(0, -1).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, editingSale.total - sumOthers);
      const updated = currentMethods.map((p, idx) => 
        idx === currentMethods.length - 1 ? { ...p, amount: remaining } : p
      );
      setEditingSale({
        ...editingSale,
        payments: updated
      });
    }
  };

  const handleSaveEditSale = async () => {
    if (!editingSale) return;
    if (editingSale.items.length === 0) {
      setSaleEditError('La venta debe tener al menos un producto. Si deseas cancelarla, usa la opción "Borrar Transacción".');
      return;
    }

    const itemsTotal = editingSale.items.reduce((sum, it) => sum + it.subtotal, 0);
    const paymentsTotal = editingSale.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    if (Math.abs(itemsTotal - paymentsTotal) > 0.01) {
      setSaleEditError(`La suma de pagos ($${paymentsTotal.toLocaleString()}) debe ser igual al total de la venta ($${itemsTotal.toLocaleString()}). Haz clic en "Ajustar al total" o ajusta los importes.`);
      return;
    }

    setIsSavingSale(true);
    setSaleEditError(null);
    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingSale.user_id,
          payments: editingSale.payments,
          items: editingSale.items
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar la transacción');
      }

      setShowEditSaleModal(false);
      setShowSaleDetailModal(false);
      setEditingSale(null);
      setViewingSale(null);
      await fetchTransactionDetails();
      await fetchData();
    } catch (err: any) {
      setSaleEditError(err.message || 'Error al actualizar la transacción');
    } finally {
      setIsSavingSale(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!editingSale) return;
    setIsDeletingSale(true);
    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al borrar la transacción');
      }

      setShowDeleteConfirm(false);
      setShowEditSaleModal(false);
      setShowSaleDetailModal(false);
      setEditingSale(null);
      setViewingSale(null);
      await fetchTransactionDetails();
      await fetchData();
    } catch (err: any) {
      console.error('Error al borrar la venta:', err);
      setSaleEditError(err.message || 'Error al borrar la transacción');
    } finally {
      setIsDeletingSale(false);
    }
  };

  const handleCheckout = async (payments: { method: string, amount: number }[]) => {
    if (cart.length === 0) return;
    if (!isCashOpen) {
      handleOpenOpenCashModal();
      return;
    }
    setIsProcessing(true);
    try {
      const saleData = {
        total: cartTotal,
        payments: payments,
        items: [...cart],
        user_id: currentUser?.id,
        pos_point_id: currentShift?.pos_point_id || null
      };
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (res.ok) {
        setLastSale({
          ...saleData,
          date: new Date().toLocaleString()
        });
        setPrintMode('sale');
        setCart([]);
        setShowSuccess(true);
        setShowSplitModal(false);
        setShowMobileCart(false);
        setSplitAmounts({ 'Efectivo': 0, 'Tarjeta': 0, 'Transferencia': 0 });
        setSplitError(null);
        fetchData();
        fetchCurrentShift();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    setPrintMode('sale');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleSplitCheckout = () => {
    setSplitError(null);
    const totalAssigned = Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0);
    if (Math.abs(totalAssigned - cartTotal) > 0.01) {
      setSplitError(`El total asignado ($${totalAssigned.toLocaleString()}) debe ser igual al total de la venta ($${cartTotal.toLocaleString()})`);
      return;
    }
    const payments = Object.keys(splitAmounts)
      .filter((method) => splitAmounts[method] > 0)
      .map((method) => ({ method, amount: splitAmounts[method] }));
    handleCheckout(payments);
  };

  const handleAddCategory = () => {
    setShowNewCategoryModal(true);
  };

  const handleCategoryCreated = async (newId: number, _newName: string) => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats);
      }
      setProductForm(prev => ({ ...prev, category_id: newId }));
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestPrint = (customSettings?: AppSettings) => {
    const active = customSettings || settings;
    setLastSale({
      items: [
        { id: 1, name: '1kg Helado (3 sabores)', category_id: 1, category_name: 'Helados por Peso', cost: 6000, price: 12000, stock_quantity: 50, unit: 'kg', quantity: 1 },
        { id: 3, name: 'Cucurucho Simple', category_id: 2, category_name: 'Cucuruchos y Vasos', cost: 800, price: 2500, stock_quantity: 100, unit: 'un', quantity: 2 },
        { id: 5, name: 'Agua Mineral 500ml', category_id: 3, category_name: 'Bebidas', cost: 500, price: 1200, stock_quantity: 48, unit: 'un', quantity: 1 }
      ],
      total: 18200,
      payments: [
        { method: 'Efectivo', amount: 10000 },
        { method: 'Transferencia', amount: 8200 }
      ],
      date: new Date().toLocaleString()
    });

    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({ name: '', price: 0, cost: 0, stock_quantity: 0, category_id: 1, unit: 'un' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      cost: product.cost || 0,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      unit: product.unit
    });
    setShowProductModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({ description: '', amount: 0, payment_method: 'Efectivo' });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryOrder = ["Helados por Peso", "Cucuruchos y Vasos", "Envasado", "Otros"];

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category_name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <>
      <div className="flex h-screen bg-slate-50 overflow-hidden print:hidden">
      {/* Sidebar */}
      <aside className={`hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-brand-primary p-2 rounded-xl text-white">
            <IceCream size={24} />
          </div>
          <span className="hidden lg:block font-display font-bold text-xl tracking-tight">GelatoFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            active={activeTab === 'pos'} 
            onClick={() => setActiveTab('pos')}
            icon={<ShoppingCart size={20} />}
            label="Venta (POS)"
          />
          <NavItem 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<Package size={20} />}
            label="Inventario"
          />
          {currentUser?.role === 'admin' && (
            <>
              <NavItem 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')}
                icon={<BarChart3 size={20} />}
                label="Reportes"
              />
              <NavItem 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')}
                icon={<Users size={20} />}
                label="Usuarios"
              />
              <NavItem 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
                icon={<Sliders size={20} />}
                label="Configuración"
              />
            </>
          )}
        </nav>

        {/* Cash Register Quick Action in Sidebar */}
        <div className="px-4 py-3 mx-4 my-2 rounded-2xl border bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store size={13} />
              Caja / Turno
            </span>
            <span className={`w-2 h-2 rounded-full ${isCashOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="text-xs font-bold text-slate-800 truncate mb-2">
            {isCashOpen && currentShift ? (currentShift.pos_point_name || 'Caja Abierta') : 'Caja Cerrada'}
          </div>
          {isCashOpen ? (
            <button
              type="button"
              onClick={handleOpenCloseCashModal}
              className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-red-200"
            >
              <Lock size={12} />
              <span>Cerrar Caja</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenOpenCashModal}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Coins size={13} />
              <span>Abrir Caja</span>
            </button>
          )}
        </div>

        {/* Supabase Status Pill in Sidebar */}
        <div className="px-4 py-2 border-t border-slate-100">
          <div 
            onClick={() => currentUser?.role === 'admin' && setActiveTab('settings')}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              currentUser?.role === 'admin' ? 'cursor-pointer hover:bg-emerald-50' : ''
            } bg-emerald-50/50 border-emerald-200/80 text-emerald-800`}
            title="Conectado a Supabase Cloud (zsirhvqjatpjulyllwtb)"
          >
            <div className="flex items-center gap-2">
              <Cloud size={15} className="text-emerald-600" />
              <span className="font-semibold text-[11px]">Supabase Cloud</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="hidden lg:block flex-1">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
            </div>
            <LogOut size={16} className="text-slate-300 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-primary p-1.5 rounded-lg text-white">
              <IceCream size={18} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Chuly Helados</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              onClick={() => currentUser?.role === 'admin' && setActiveTab('settings')}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold"
              title="Supabase Conectado"
            >
              <Cloud size={12} className="text-emerald-600" />
              <span>Cloud</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-600">{currentUser?.name}</span>
            <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Mobile Cash Status Banner */}
        <div className="lg:hidden px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          {isCashOpen && currentShift ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-900">{currentShift.pos_point_name || 'Caja Abierta'}</span>
                <span className="text-[10px] text-slate-500 font-mono">(${Number(currentShift.initial_cash).toLocaleString()})</span>
              </div>
              <button
                type="button"
                onClick={handleOpenCloseCashModal}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Lock size={11} />
                <span>Cerrar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-bold text-amber-900">Caja Cerrada</span>
              </div>
              <button
                type="button"
                onClick={handleOpenOpenCashModal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Coins size={11} />
                <span>Abrir Caja</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === 'pos' && (
          <div className="flex flex-1 overflow-hidden relative">
            {/* Products Grid */}
            <div className={`flex-1 p-6 overflow-y-auto ${showMobileCart ? 'hidden lg:block' : 'block'}`}>
              <header className="mb-4 lg:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-display font-bold">Punto de Venta</h1>
                  <p className="text-slate-500">Selecciona los productos para la orden</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Cash status in desktop header */}
                  <div className="hidden lg:flex items-center gap-2">
                    {isCashOpen && currentShift ? (
                      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-1.5 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-900 block leading-tight">
                            {currentShift.pos_point_name || 'Caja Abierta'}
                          </span>
                          <span className="text-[10px] text-emerald-700">
                            Fondo inicial: ${Number(currentShift.initial_cash).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenCloseCashModal}
                          className="ml-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Lock size={12} />
                          <span>Cerrar Caja</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-1.5 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-amber-900">Caja Cerrada</span>
                        <button
                          type="button"
                          onClick={handleOpenOpenCashModal}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Coins size={13} />
                          <span>Abrir Caja</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1 lg:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar producto..."
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchQuery(''), 200)}
                    />
                  </div>
                </div>
              </header>

              {!isCashOpen && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">La caja se encuentra cerrada</h4>
                      <p className="text-xs text-amber-700">Para comenzar a operar y registrar ventas, abre el turno de caja ingresando el dinero inicial disponible.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenOpenCashModal}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Coins size={15} />
                    <span>Abrir Caja Ahora</span>
                  </button>
                </div>
              )}

              <div className="space-y-12 pb-24 lg:pb-0">
                {sortedCategories.map(category => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xs font-display font-bold text-slate-400 uppercase tracking-[0.2em]">{category}</h2>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                      {groupedProducts[category].map(product => (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="bg-white p-2.5 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all text-left group"
                        >
                          <div className="flex justify-between items-start mb-1 lg:mb-2">
                            <span className="text-[9px] lg:text-xs font-semibold px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 rounded-full text-slate-600 truncate max-w-[80px]">
                              {product.category_name}
                            </span>
                            <Plus size={14} className="text-slate-300 group-hover:text-brand-primary transition-colors flex-shrink-0" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-xs lg:text-base mb-0.5 lg:mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-brand-primary font-display font-bold text-sm lg:text-lg">${product.price.toLocaleString()}</p>
                          <p className="text-[8px] lg:text-[10px] text-slate-400 mt-1 lg:mt-2 uppercase tracking-wider">Stock: {product.stock_quantity} {product.unit}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-slate-400">No se encontraron productos</p>
                  </div>
                )}
              </div>

              {/* Mobile "Aceptar" Button */}
              {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-6 left-6 right-6 z-20">
                  <button 
                    onClick={() => setShowMobileCart(true)}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={24} />
                    Aceptar ({cart.length})
                  </button>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className={`w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10 ${showMobileCart ? 'block' : 'hidden lg:flex'}`}>
              <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowMobileCart(false)}
                    className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X size={20} />
                  </button>
                  <h2 className="font-display font-bold text-xl">Orden Actual</h2>
                </div>
                <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold">
                  {cart.length} items
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <ShoppingCart size={48} strokeWidth={1} />
                      <p className="text-sm">El carrito está vacío</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id} 
                        className="bg-slate-50 p-3 rounded-xl flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500">${item.price.toLocaleString()}</p>
                            {promotions.find(p => p.product_id === item.id && item.quantity >= p.quantity_threshold) && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">Promo</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-slate-50 rounded text-slate-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-slate-50 rounded text-slate-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-display font-bold">
                  <span>Total</span>
                  <span className="text-brand-primary">${cartTotal.toLocaleString()}</span>
                </div>

                <div className="pt-2 space-y-2">
                  {!isCashOpen && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                        <span>Caja cerrada. Abre turno antes de cobrar.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenOpenCashModal}
                        className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0 cursor-pointer"
                      >
                        Abrir
                      </button>
                    </div>
                  )}

                  <button 
                    disabled={cart.length === 0 || isProcessing}
                    onClick={() => {
                      if (!isCashOpen) {
                        handleOpenOpenCashModal();
                        return;
                      }
                      const isTabletOrMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                      if (isTabletOrMobile) {
                        setSplitAmounts({ 'Efectivo': 0, 'Tarjeta': 0, 'Transferencia': 0 });
                      } else {
                        setSplitAmounts({ 'Efectivo': cartTotal, 'Tarjeta': 0, 'Transferencia': 0 });
                      }
                      setShowSplitModal(true);
                    }}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 text-lg cursor-pointer"
                  >
                    <CreditCard size={24} />
                    Cobrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-8 overflow-y-auto">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-display font-bold">Gestión de Inventario</h1>
                <p className="text-slate-500">Control de stock y productos</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPromotionModal(true)}
                  disabled={currentUser?.role !== 'admin'}
                  className="bg-brand-secondary/10 text-brand-secondary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-secondary/20 transition-all disabled:opacity-50"
                >
                  <Tag size={20} />
                  Promociones
                </button>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', price: 0, cost: 0, stock_quantity: 0, category_id: 1, unit: 'un' });
                    setShowProductModal(true);
                  }}
                  disabled={currentUser?.role !== 'admin'}
                  className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Plus size={20} />
                  Nuevo Producto
                </button>
              </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Costo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                      <td className="px-6 py-4 text-slate-500">{product.category_name}</td>
                      <td className="px-6 py-4 font-display font-bold text-slate-500">${product.cost?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 font-display font-bold text-slate-800">${product.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-mono ${product.stock_quantity < 10 ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                          {product.stock_quantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock_quantity < 10 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Stock Bajo</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Normal</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => openEditModal(product)}
                          disabled={currentUser?.role !== 'admin'}
                          className="text-slate-400 hover:text-brand-primary p-1 transition-colors disabled:opacity-30"
                          title={currentUser?.role === 'admin' ? "Editar producto" : "Solo administradores"}
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && currentUser?.role === 'admin' && (
          <div className="p-8 overflow-y-auto">
            <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold">Reportes de Ventas</h1>
                <p className="text-slate-500">Resumen de actividad y ganancias</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setReportRange({ start: today, end: today });
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Hoy
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                    setReportRange({ start: firstDay, end: lastDay });
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Este Mes
                </button>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</label>
                  <input 
                    type="date" 
                    className="text-sm border-none focus:ring-0 p-1"
                    value={reportRange.start}
                    onChange={(e) => setReportRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="w-px h-8 bg-slate-200 mx-2" />
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasta</label>
                  <input 
                    type="date" 
                    className="text-sm border-none focus:ring-0 p-1"
                    value={reportRange.end}
                    onChange={(e) => setReportRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ventas Totales</p>
                <h3 className="text-3xl font-display font-bold text-slate-800">
                  ${reports.sales.reduce((sum, r) => sum + r.total_sales, 0).toLocaleString()}
                </h3>
              </div>
              <div 
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-brand-primary transition-all group"
                onClick={fetchTransactionDetails}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transacciones</p>
                  <Eye size={16} className="text-slate-400 group-hover:text-brand-primary" />
                </div>
                <h3 className="text-3xl font-display font-bold text-slate-800">
                  {reports.sales.reduce((sum, r) => sum + r.transaction_count, 0)}
                </h3>
                <p className="text-xs text-brand-primary font-semibold mt-1">Ver detalles de ventas →</p>
              </div>
              <div 
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 transition-all group"
                onClick={async () => {
                  await fetchCashShiftsHistory();
                  setShowCashHistoryModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cierres de Caja</p>
                  <History size={16} className="text-slate-400 group-hover:text-emerald-600" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800">
                  Historial de Arqueos
                </h3>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Ver turnos y reimprimir tickets →</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pago</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transacciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.sales.map((report, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{report.payment_method}</td>
                      <td className="px-6 py-4 font-display font-bold text-slate-800">${report.total_sales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500">{report.transaction_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle de Gastos</h4>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Medio</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length > 0 ? expenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-800">{exp.description}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{exp.payment_method}</td>
                      <td className="px-6 py-4 font-display font-bold text-red-500">-${exp.amount.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No hay gastos registrados en este periodo</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Banknote size={20} />
                Gastos
              </button>
              <button 
                onClick={() => setShowStatusModal(true)}
                className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={20} />
                Estado
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <div className="p-8 overflow-y-auto">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-display font-bold">Gestión de Usuarios</h1>
                <p className="text-slate-500">Crea y modifica perfiles de acceso</p>
              </div>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', role: 'empleado', password: '' });
                  setShowUserModal(true);
                }}
                className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-all"
              >
                <Plus size={20} />
                Nuevo Usuario
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${user.role === 'admin' ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                    {user.role === 'admin' ? <Shield size={24} /> : <UserCircle size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button 
                    onClick={() => openEditUserModal(user)}
                    className="p-2 text-slate-400 hover:text-brand-primary transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && currentUser?.role === 'admin' && (
          <SettingsView 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            currentUser={currentUser}
            onTestPrint={handleTestPrint}
          />
        )}

        {/* Mobile Tab Bar removed as per request */}
      </main>
    </div>

      {/* Promotion Modal */}
      <AnimatePresence>
        {showPromotionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPromotionModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[90vh] cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-display font-bold">Gestión de Promociones</h2>
                <button onClick={() => setShowPromotionModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
                {/* Create Promotion Form */}
                <div className="flex-1 space-y-6">
                  <h3 className="font-bold text-slate-800">Nueva Promoción</h3>
                  <form onSubmit={handleSavePromotion} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Producto</label>
                      <select 
                        required
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        value={promotionForm.product_id}
                        onChange={(e) => setPromotionForm(prev => ({ ...prev, product_id: parseInt(e.target.value) }))}
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cantidad (Mín.)</label>
                        <input 
                          required
                          type="number"
                          min="2"
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                          value={promotionForm.quantity_threshold}
                          onChange={(e) => setPromotionForm(prev => ({ ...prev, quantity_threshold: parseInt(e.target.value) || 2 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Precio Promo ($)</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                          value={promotionForm.promo_price || ''}
                          onChange={(e) => setPromotionForm(prev => ({ ...prev, promo_price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isProcessing || !promotionForm.product_id}
                      className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? 'Guardando...' : 'Añadir Promoción'}
                    </button>
                  </form>
                </div>

                {/* Promotions List */}
                <div className="flex-1 space-y-6">
                  <h3 className="font-bold text-slate-800">Promociones Activas</h3>
                  <div className="space-y-3">
                    {promotions.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No hay promociones configuradas</p>
                    ) : (
                      promotions.map(promo => (
                        <div key={promo.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center group">
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{promo.product_name}</h4>
                            <p className="text-xs text-slate-500">
                              {promo.quantity_threshold} unidades por <span className="font-bold text-brand-primary">${promo.promo_price.toLocaleString()}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-display font-bold">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre</label>
                  <input 
                    required
                    type="text"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rol</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'empleado' }))}
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador (Control total)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onFocus={(e) => e.target.select()}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (currentUser) setShowLoginModal(false);
            }}
            className={`fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 ${currentUser ? 'cursor-pointer' : ''}`}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-7 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative cursor-default"
            >
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}

              <div className="bg-brand-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-4">
                <IceCream size={34} />
              </div>
              <h1 className="text-2xl font-display font-bold mb-1">Chuly Helados</h1>
              <p className="text-slate-500 text-xs mb-5">Ingresa tus credenciales para acceder</p>
              
              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Usuario</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                    value={loginForm.name}
                    onChange={(e) => {
                      setLoginForm(prev => ({ ...prev, name: e.target.value }));
                      setTimeout(() => loginPasswordInputRef.current?.focus(), 50);
                    }}
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña / PIN Numérico</label>
                  <input 
                    ref={loginPasswordInputRef}
                    required
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="current-password"
                    placeholder="••••"
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-center text-xl font-mono tracking-widest"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                {/* Touch Numeric Keypad for Mobile and POS Tablets */}
                <div className="pt-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-2">Teclado Numérico</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setLoginForm(prev => ({ ...prev, password: prev.password + num.toString() }));
                          loginPasswordInputRef.current?.focus();
                        }}
                        className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-brand-primary/10 active:text-brand-primary text-slate-800 font-bold rounded-xl text-base transition-colors border border-slate-200/80 cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setLoginForm(prev => ({ ...prev, password: '' }));
                        loginPasswordInputRef.current?.focus();
                      }}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      title="Limpiar"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginForm(prev => ({ ...prev, password: prev.password + '0' }));
                        loginPasswordInputRef.current?.focus();
                      }}
                      className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-base transition-colors border border-slate-200/80 cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginForm(prev => ({ ...prev, password: prev.password.slice(0, -1) }));
                        loginPasswordInputRef.current?.focus();
                      }}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      title="Borrar último"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all mt-3 cursor-pointer text-sm"
                >
                  Iniciar Sesión
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal (Create/Edit) */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProductModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-display font-bold">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre</label>
                  <input 
                    required
                    type="text"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Costo ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={productForm.cost || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Precio ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={productForm.price || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={productForm.stock_quantity || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unidad</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      value={productForm.unit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                    >
                      <option value="un">Unidad (un)</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="lt">Litro (lt)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryModal(true)}
                      className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Nueva Categoría
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm font-medium"
                      value={productForm.category_id}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewCategoryModal(true);
                        } else {
                          setProductForm(prev => ({ ...prev, category_id: parseInt(e.target.value) }));
                        }
                      }}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="new" className="text-brand-primary font-bold">+ Crear nueva categoría...</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryModal(true)}
                      title="Crear nueva categoría"
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <FolderPlus size={18} />
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Payment Modal */}
      <AnimatePresence>
        {showSplitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSplitModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-800">Cobrar Venta</h2>
                  <p className="text-xs text-slate-500">Ingresa el importe según la forma de pago</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitAmounts({ 'Efectivo': 0, 'Tarjeta': 0, 'Transferencia': 0 })}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Vaciar todos los campos"
                  >
                    Limpiar
                  </button>
                  <button onClick={() => setShowSplitModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Total a cobrar:</span>
                  <span className="text-2xl font-display font-bold text-brand-primary">${cartTotal.toLocaleString()}</span>
                </div>

                <div className="space-y-4">
                  {Object.keys(splitAmounts).map((method, idx) => (
                    <div key={method} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{method}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const otherTotals = Object.keys(splitAmounts)
                              .filter(m => m !== method)
                              .reduce((sum, m) => sum + (splitAmounts[m] || 0), 0);
                            const remaining = Math.max(0, cartTotal - otherTotals);
                            setSplitAmounts(prev => ({ ...prev, [method]: remaining }));
                          }}
                          className="text-[11px] font-bold text-brand-primary hover:underline"
                        >
                          Pagar restante
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          inputMode="decimal"
                          autoFocus={idx === 0}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-mono font-bold text-slate-800"
                          value={splitAmounts[method] === 0 ? '' : splitAmounts[method] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitAmounts(prev => ({ ...prev, [method]: val === '' ? 0 : parseFloat(val) || 0 }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {splitError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                      {splitError}
                    </div>
                  )}
                  {cartTotal - Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0) > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-red-500">Diferencia a cobrar:</span>
                      <span className="font-bold text-red-500">
                        ${(cartTotal - Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-slate-500">Asignado:</span>
                    <span className={`font-bold ${Math.abs(Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0) - cartTotal) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
                      ${Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleSplitCheckout}
                    disabled={isProcessing || Math.abs(Object.keys(splitAmounts).reduce((sum, key) => sum + splitAmounts[key], 0) - cartTotal) > 0.01}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:shadow-none text-base"
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTransactionModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-800">Detalle de Transacciones</h2>
                  <p className="text-sm text-slate-500">Listado detallado de las ventas del período</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setTransactionViewMode('sales')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        transactionViewMode === 'sales'
                          ? 'bg-white text-brand-primary shadow-sm'
                          : 'hover:text-slate-800'
                      }`}
                    >
                      Por Venta ({groupedTransactions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionViewMode('items')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        transactionViewMode === 'items'
                          ? 'bg-white text-brand-primary shadow-sm'
                          : 'hover:text-slate-800'
                      }`}
                    >
                      Por Producto ({transactionDetails.length})
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowTransactionModal(false)}
                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {transactionViewMode === 'sales' ? (
                    /* GROUPED BY SALE VIEW */
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venta #</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendedor</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Artículos</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pago</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                              No hay transacciones registradas en este período
                            </td>
                          </tr>
                        ) : (
                          groupedTransactions.map((sale) => (
                            <tr key={sale.sale_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                                {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg">
                                  #{sale.sale_id}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold">
                                    {sale.seller_name?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-xs text-slate-600 font-medium">{sale.seller_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-700">
                                <span className="font-semibold text-slate-800">
                                  {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1.5 truncate inline-block max-w-[200px] align-bottom">
                                  ({sale.items.map(it => `${it.product_name} x${it.quantity}`).join(', ')})
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600 tracking-tight whitespace-nowrap">
                                  {sale.payment_method}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-extrabold text-brand-primary whitespace-nowrap">
                                ${sale.sale_total.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleOpenSaleDetail(sale.sale_id)}
                                    disabled={isLoadingSale}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                    title="Ver detalles de venta completos"
                                  >
                                    <Eye size={13} />
                                    <span>Detalles de venta</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditSale(sale.sale_id)}
                                    disabled={isLoadingSale}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    title="Editar detalles de venta o borrar transacción"
                                  >
                                    <Edit size={13} />
                                    <span>Editar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
                    /* FLAT BY PRODUCT VIEW */
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venta #</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant.</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subtotal</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pago</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendedor</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactionDetails.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">
                              No hay transacciones registradas en este período
                            </td>
                          </tr>
                        ) : (
                          transactionDetails.map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                                {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                                  #{t.sale_id}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-800">{t.product_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 font-semibold">{t.quantity}</td>
                              <td className="px-4 py-3 text-sm font-bold text-brand-primary whitespace-nowrap">${t.subtotal.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600 tracking-tight whitespace-nowrap">
                                  {t.payment_method}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold">
                                    {t.seller_name?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-xs text-slate-600">{t.seller_name || 'Desconocido'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleOpenSaleDetail(t.sale_id)}
                                    disabled={isLoadingSale}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                    title="Ver detalles de venta"
                                  >
                                    <Eye size={12} />
                                    <span>Detalles</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditSale(t.sale_id)}
                                    disabled={isLoadingSale}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    title="Editar detalles o borrar transacción"
                                  >
                                    <Edit size={12} />
                                    <span>Editar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowTransactionModal(false)}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETALLES DE VENTA MODAL */}
      <AnimatePresence>
        {showSaleDetailModal && viewingSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaleDetailModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto cursor-default"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                      <Receipt size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-display font-bold text-slate-800">
                          Detalles de Venta #{viewingSale.id}
                        </h2>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                          Registrada
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(viewingSale.created_at).toLocaleString()} • Vendedor: <strong className="text-slate-700">{viewingSale.seller_name || 'Desconocido'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSaleDetailModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Total Summary Card */}
                <div className="bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-white p-5 rounded-2xl border border-brand-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monto Total de la Venta</span>
                    <h3 className="text-3xl font-display font-extrabold text-brand-primary mt-0.5">
                      ${viewingSale.total.toLocaleString()}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500">Forma principal</span>
                    <p className="text-sm font-bold text-slate-800">{viewingSale.payment_method}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Productos Incluidos ({viewingSale.items.length})
                    </h4>
                    <span className="text-xs text-slate-400">
                      {viewingSale.items.reduce((s, it) => s + it.quantity, 0)} unidades en total
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Producto</th>
                          <th className="px-3 py-2.5 text-center">Cant.</th>
                          <th className="px-3 py-2.5 text-right">Precio Unit.</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {viewingSale.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-800">{item.product_name}</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-500">
                              ${item.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                              ${item.subtotal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Desglose de Formas de Pago
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {viewingSale.payments.map((p, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">{p.method}</span>
                        <p className="text-base font-display font-bold text-slate-800 mt-0.5">
                          ${p.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePrintSaleReceipt(viewingSale)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Imprimir Ticket</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSaleDetailModal(false)}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSale(JSON.parse(JSON.stringify(viewingSale)));
                      setShowSaleDetailModal(false);
                      setShowEditSaleModal(true);
                    }}
                    className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-primary/20 cursor-pointer flex items-center gap-2"
                  >
                    <Edit size={15} />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT SALE MODAL */}
      <AnimatePresence>
        {showEditSaleModal && editingSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditSaleModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto cursor-default"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                      <Edit size={20} />
                    </div>
                    <h2 className="text-xl font-display font-bold text-slate-800">
                      Editar Transacción #{editingSale.id}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(editingSale.created_at).toLocaleString()} • Vendedor: {editingSale.seller_name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowEditSaleModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {saleEditError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span>{saleEditError}</span>
                  </div>
                )}

                {/* Section: Vendedor */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Vendedor / Cajero Responsable
                  </label>
                  <select
                    value={editingSale.user_id || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, user_id: Number(e.target.value) || null })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">(Sin asignar)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section: Productos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Productos de la Venta ({editingSale.items.length})
                    </h3>
                    <span className="text-xs font-mono font-bold text-brand-primary">
                      Total Items: ${editingSale.items.reduce((s, it) => s + it.subtotal, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-white divide-y divide-slate-100">
                    {editingSale.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{item.product_name}</h4>
                          <p className="text-[11px] text-slate-500">
                            ${item.price?.toLocaleString()} c/u
                          </p>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold text-xs shadow-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold text-xs shadow-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-20 text-right">
                          <span className="text-xs font-mono font-bold text-slate-800">
                            ${item.subtotal.toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromSale(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Quitar producto de la venta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {editingSale.items.length === 0 && (
                      <p className="text-xs text-center text-slate-400 py-3 italic">
                        No quedan productos en esta venta.
                      </p>
                    )}
                  </div>

                  {/* Add product to sale dropdown */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={addProductToSaleId}
                      onChange={(e) => handleAddProductToSale(Number(e.target.value))}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-brand-primary"
                    >
                      <option value="0">+ Agregar otro producto a esta transacción...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ${p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section: Formas de Pago */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Formas de Pago
                    </h3>
                    <button
                      type="button"
                      onClick={handleAutoAdjustPayments}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Ajustar al total
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['Efectivo', 'Tarjeta', 'Transferencia'].map((method) => {
                      const existing = editingSale.payments.find(p => p.method === method);
                      const currentAmount = existing ? existing.amount : 0;
                      return (
                        <div key={method} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">{method}</span>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-brand-primary"
                              value={currentAmount || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const otherPayments = editingSale.payments.filter(p => p.method !== method);
                                const updated = val > 0 
                                  ? [...otherPayments, { method, amount: val }] 
                                  : otherPayments;
                                setEditingSale({
                                  ...editingSale,
                                  payments: updated
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Balance checker pill */}
                  {(() => {
                    const totalItems = editingSale.items.reduce((s, it) => s + it.subtotal, 0);
                    const totalPayments = editingSale.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                    const diff = totalItems - totalPayments;
                    const isBalanced = Math.abs(diff) <= 0.01;
                    return (
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                        isBalanced 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <span>Total Venta: <strong>${totalItems.toLocaleString()}</strong> | Pagado: <strong>${totalPayments.toLocaleString()}</strong></span>
                        <span>
                          {isBalanced 
                            ? '✓ Pagos balanceados' 
                            : `Diferencia: $${Math.abs(diff).toLocaleString()} (${diff > 0 ? 'Falta' : 'Sobra'})`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer with Delete Option */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Destructive Delete Button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Eliminar y anular transacción permanentemente"
                >
                  <Trash2 size={15} />
                  <span>Borrar Transacción</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSaleModal(false);
                      if (viewingSale) setShowSaleDetailModal(true);
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {viewingSale ? 'Volver a Detalles' : 'Cancelar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditSale}
                    disabled={isSavingSale}
                    className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingSale ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeleteConfirm && editingSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-60 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">¿Borrar Transacción #{editingSale.id}?</h3>
                  <p className="text-xs text-slate-500">Esta acción anulará la venta en los registros</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
                <p className="font-semibold">
                  Al borrar esta venta de <strong>${editingSale.total.toLocaleString()}</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>La transacción se eliminará de los reportes y del historial en la nube.</li>
                  <li>
                    <strong>Reintegro de stock automático:</strong> todos los productos de la venta se reintegrarán al stock del local y de Supabase.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingSale}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSale}
                  disabled={isDeletingSale}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  {isDeletingSale ? 'Eliminando...' : 'Sí, Borrar y Reintegrar Stock'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExpenseModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-display font-bold">Registrar Gasto</h2>
                <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción / Gasto</label>
                  <input 
                    required
                    autoFocus
                    type="text"
                    onFocus={(e) => e.target.select()}
                    placeholder="Ej: Pago de luz, Alquiler..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Importe ($)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Medio de Pago</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Guardando...' : 'Registrar Gasto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Modal (Estado) */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatusModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full cursor-default"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-800">Estado del Periodo</h2>
                  <p className="text-xs text-slate-500">Del {reportRange.start} al {reportRange.end}</p>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Ganancia</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Porcentaje</p>
                      <p className="text-2xl font-display font-bold text-emerald-700">
                        {reports.revenue > 0 ? (((reports.revenue - reports.cost) / reports.revenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Importe</p>
                      <p className="text-2xl font-display font-bold text-emerald-700">
                        ${(reports.revenue - reports.cost).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Total</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-600">Ventas Totales</span>
                      <span className="font-display font-bold text-slate-800">${reports.sales.reduce((sum, r) => sum + r.total_sales, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-600">Gastos</span>
                      <span className="font-display font-bold text-red-500">-${reports.expenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 mt-4">
                      <span className="font-bold text-slate-800">Saldo Final</span>
                      <span className="text-2xl font-display font-bold text-brand-primary">
                        ${(reports.sales.reduce((sum, r) => sum + r.total_sales, 0) - reports.expenses).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </section>

                <button 
                  onClick={() => setShowStatusModal(false)}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-xs w-full cursor-default"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">¡Venta Exitosa!</h2>
              <p className="text-slate-500 text-sm mb-8">El stock ha sido actualizado y la transacción registrada.</p>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={handlePrint}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer size={20} />
                  Imprimir Comanda
                </button>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPEN CASH SHIFT MODAL */}
      <AnimatePresence>
        {showOpenCashModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOpenCashModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default my-auto border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800">Apertura de Caja</h2>
                    <p className="text-xs text-slate-500">Inicia el turno de trabajo y registra el fondo</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowOpenCashModal(false)} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmOpenCash} className="p-6 space-y-4">
                {cashError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {cashError}
                  </div>
                )}

                {/* POS Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MonitorCheck size={14} className="text-brand-primary" />
                    Punto de Venta / Terminal *
                  </label>
                  <select
                    required
                    value={selectedPosPointId}
                    onChange={(e) => setSelectedPosPointId(Number(e.target.value) || '')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    {posPoints.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name} {pos.label ? `(${pos.label})` : ''} {pos.active ? '• Activo' : '• Inactivo'}
                      </option>
                    ))}
                    {posPoints.length === 0 && (
                      <option value="">Caja Principal Predeterminada</option>
                    )}
                  </select>
                </div>

                {/* Initial Cash Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Dinero disponible inicial ($) *</span>
                    <span className="text-[11px] text-slate-400 font-normal">Fondo de cambio en gaveta</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      value={initialCashInput}
                      onChange={(e) => setInitialCashInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-xl font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* Quick cash chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[0, 5000, 10000, 20000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInitialCashInput(amt.toString())}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cashier indicator */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Cajero responsable:</span>
                  <span className="font-bold text-slate-800">{currentUser?.name || 'Cajero Actual'}</span>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Turno mañana, billetes chicos..."
                    onFocus={(e) => e.target.select()}
                    value={cashNotesInput}
                    onChange={(e) => setCashNotesInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowOpenCashModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCashSubmitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Coins size={15} />
                    <span>{isCashSubmitting ? 'Abriendo...' : 'Abrir Caja y Comenzar'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLOSE CASH SHIFT MODAL */}
      <AnimatePresence>
        {showCloseCashModal && currentShift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCloseCashModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-xl w-full cursor-default my-auto border border-slate-100 max-h-[92vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800">Cierre de Caja y Arqueo</h2>
                    <p className="text-xs text-slate-500">
                      {currentShift.pos_point_name || 'Caja Principal'} • Turno #{currentShift.id}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCloseCashModal(false)} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmCloseCash} className="flex-1 overflow-y-auto p-6 space-y-5">
                {cashError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {cashError}
                  </div>
                )}

                {/* Info pill */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Apertura</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(currentShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(currentShift.opened_at).toLocaleDateString()})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Cajero</span>
                    <span className="font-semibold text-slate-700">{currentShift.user_name || currentUser?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Fondo Inicial</span>
                    <span className="font-mono font-bold text-slate-800">${Number(currentShift.initial_cash || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Sales Breakdown by Payment Method */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Desglose de Ventas por Método</span>
                    <span className="font-mono font-bold text-brand-primary text-xs">
                      Total Ventas: ${Number(currentShift.total_sales || 0).toLocaleString()} ({currentShift.transaction_count || 0} transacciones)
                    </span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Efectivo</span>
                      <p className="text-base font-mono font-bold text-emerald-900 mt-0.5">
                        ${Number(currentShift.total_cash_sales || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Transferencia</span>
                      <p className="text-base font-mono font-bold text-blue-900 mt-0.5">
                        ${Number(currentShift.total_transfer_sales || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                      <span className="text-[10px] font-bold text-purple-800 uppercase block">Tarjeta</span>
                      <p className="text-base font-mono font-bold text-purple-900 mt-0.5">
                        ${Number(currentShift.total_card_sales || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {Number(currentShift.total_expenses || 0) > 0 && (
                    <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-red-700 font-medium">Gastos pagados en el turno:</span>
                      <span className="font-mono font-bold text-red-700">-${Number(currentShift.total_expenses || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Cash balancing section */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Efectivo Teórico Esperado en Gaveta</span>
                      <p className="text-xs text-slate-500 font-mono">Fondo inicial (${Number(currentShift.initial_cash || 0).toLocaleString()}) + Efectivo (${Number(currentShift.total_cash_sales || 0).toLocaleString()}) - Gastos (${Number(currentShift.total_expenses || 0).toLocaleString()})</p>
                    </div>
                    <span className="text-2xl font-mono font-extrabold text-slate-800">
                      ${Number(currentShift.expected_cash || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Efectivo Real Contado en Gaveta ($) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setCountedCashInput((currentShift.expected_cash || 0).toString())}
                        className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
                      >
                        Copiar esperado (${Number(currentShift.expected_cash || 0).toLocaleString()})
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        placeholder={currentShift.expected_cash?.toString() || "0"}
                        value={countedCashInput}
                        onChange={(e) => setCountedCashInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-xl font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Difference indicator */}
                  {(() => {
                    const countedNum = countedCashInput === '' ? (currentShift.expected_cash || 0) : parseFloat(countedCashInput) || 0;
                    const expectedNum = currentShift.expected_cash || 0;
                    const diff = countedNum - expectedNum;
                    const isExact = Math.abs(diff) < 0.01;

                    return (
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        isExact
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : diff > 0
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <span>
                          {isExact ? '✓ Arqueo Exacto (Sin diferencias)' : diff > 0 ? '▲ Sobrante en caja' : '▼ Faltante en caja'}
                        </span>
                        <span className="font-mono text-sm">
                          {diff > 0 ? `+$${diff.toLocaleString()}` : diff < 0 ? `-$${Math.abs(diff).toLocaleString()}` : '$0'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Observaciones de Cierre (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Billetes retirados por el administrador..."
                    onFocus={(e) => e.target.select()}
                    value={cashNotesInput}
                    onChange={(e) => setCashNotesInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCloseCashModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCashSubmitting}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock size={15} />
                    <span>{isCashSubmitting ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CASH SUMMARY TICKET MODAL */}
      <AnimatePresence>
        {showCashSummaryTicketModal && closedShiftSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCashSummaryTicketModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full cursor-default my-auto border border-slate-100 max-h-[92vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800">Cierre de Caja Exitoso</h2>
                    <p className="text-xs text-slate-500">Ticket de Arqueo y Rendición</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCashSummaryTicketModal(false)} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Thermal Ticket Preview */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 flex justify-center">
                <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-md w-full max-w-xs font-mono text-xs text-slate-800 space-y-3">
                  <div className="text-center border-b border-dashed border-slate-400 pb-3">
                    {settings.show_logo && settings.logo_url && (
                      <div className="flex justify-center mb-1">
                        <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-full" />
                      </div>
                    )}
                    <h3 className="font-black text-sm uppercase">{settings.business_name || 'Chuly Helados'}</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-600">CIERRE DE CAJA / ARQUEO Z</p>
                    <p className="text-[10px] text-slate-500 mt-1">Punto de Venta: {closedShiftSummary.pos_point_name || 'Caja Principal'}</p>
                    <p className="text-[9px] text-slate-400">Turno #{closedShiftSummary.id} • Cajero: {closedShiftSummary.user_name || 'Cajero'}</p>
                    <p className="text-[9px] text-slate-400">
                      Apertura: {new Date(closedShiftSummary.opened_at).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Cierre: {closedShiftSummary.closed_at ? new Date(closedShiftSummary.closed_at).toLocaleString() : new Date().toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between">
                      <span>Fondo Inicial:</span>
                      <span className="font-bold">${Number(closedShiftSummary.initial_cash || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Sales breakdown */}
                  <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                    <p className="font-bold text-[10px] uppercase text-slate-500 mb-1">Ventas del Turno ({closedShiftSummary.transaction_count || 0}):</p>
                    <div className="flex justify-between">
                      <span>( + ) Efectivo:</span>
                      <span className="font-bold">${Number(closedShiftSummary.total_cash_sales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>( + ) Transferencia:</span>
                      <span className="font-bold">${Number(closedShiftSummary.total_transfer_sales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>( + ) Tarjeta:</span>
                      <span className="font-bold">${Number(closedShiftSummary.total_card_sales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                      <span>TOTAL VENTAS:</span>
                      <span>${Number(closedShiftSummary.total_sales || 0).toLocaleString()}</span>
                    </div>
                    {Number(closedShiftSummary.total_expenses || 0) > 0 && (
                      <div className="flex justify-between text-red-600 pt-0.5">
                        <span>( - ) Gastos Pagados:</span>
                        <span>-${Number(closedShiftSummary.total_expenses || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Cash Balancing */}
                  <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                    <p className="font-bold text-[10px] uppercase text-slate-500 mb-1">Arqueo de Efectivo:</p>
                    <div className="flex justify-between">
                      <span>Efectivo Esperado:</span>
                      <span className="font-bold">${Number(closedShiftSummary.expected_cash || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Efectivo Real Contado:</span>
                      <span className="text-slate-900">${Number(closedShiftSummary.final_cash || 0).toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 ${
                      Number(closedShiftSummary.difference || 0) === 0
                        ? 'text-emerald-700'
                        : Number(closedShiftSummary.difference || 0) > 0
                        ? 'text-blue-700'
                        : 'text-red-700'
                    }`}>
                      <span>Diferencia:</span>
                      <span>
                        {Number(closedShiftSummary.difference || 0) > 0 ? '+' : ''}${Number(closedShiftSummary.difference || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {closedShiftSummary.notes && (
                    <div className="text-[10px] text-slate-500 border-b border-dashed border-slate-400 pb-2">
                      <span className="font-bold block">Notas:</span>
                      <p>{closedShiftSummary.notes}</p>
                    </div>
                  )}

                  <div className="pt-4 text-center space-y-4 text-[9px] text-slate-400">
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300">
                      <div className="border-t border-slate-400 pt-1">Firma Cajero</div>
                      <div className="border-t border-slate-400 pt-1">Firma Supervisor</div>
                    </div>
                    <p>Comprobante No Fiscal</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowCashSummaryTicketModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintShiftTicket(closedShiftSummary)}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-primary/20 flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Imprimir Ticket de Cierre</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CASH SHIFTS HISTORY MODAL */}
      <AnimatePresence>
        {showCashHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCashHistoryModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden cursor-default my-auto border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <History size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800">Historial de Cierres de Caja</h2>
                    <p className="text-xs text-slate-500">Arqueos de turno registrados y tickets emitidos</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCashHistoryModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cashShiftsHistory.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs italic">
                    No hay turnos cerrados aún.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Turno / POS</th>
                          <th className="px-4 py-3">Cajero</th>
                          <th className="px-4 py-3">Apertura / Cierre</th>
                          <th className="px-3 py-3 text-right">Fondo Inic.</th>
                          <th className="px-3 py-3 text-right">Ventas Totales</th>
                          <th className="px-3 py-3 text-right">Contado</th>
                          <th className="px-3 py-3 text-right">Diferencia</th>
                          <th className="px-4 py-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {cashShiftsHistory.map((shift) => (
                          <tr key={shift.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-800 block">#{shift.id} - {shift.pos_point_name || 'Caja'}</span>
                              <span className={`text-[10px] font-bold uppercase ${shift.status === 'open' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {shift.status === 'open' ? 'Abierta' : 'Cerrada'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{shift.user_name || 'Cajero'}</td>
                            <td className="px-4 py-3 text-[11px] text-slate-500">
                              <div>Abre: {new Date(shift.opened_at).toLocaleDateString()} {new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              {shift.closed_at && (
                                <div>Cierra: {new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-600">
                              ${Number(shift.initial_cash || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-800">
                              ${Number(shift.total_sales || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-800">
                              ${Number(shift.final_cash || 0).toLocaleString()}
                            </td>
                            <td className={`px-3 py-3 text-right font-mono font-bold ${
                              Number(shift.difference || 0) === 0 ? 'text-emerald-700' : Number(shift.difference || 0) > 0 ? 'text-blue-700' : 'text-red-700'
                            }`}>
                              {Number(shift.difference || 0) > 0 ? '+' : ''}${Number(shift.difference || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setClosedShiftSummary(shift);
                                  setShowCashHistoryModal(false);
                                  setShowCashSummaryTicketModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
                              >
                                <Printer size={13} />
                                <span>Ver Ticket</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Comanda or Cash Shift Ticket for Printing */}
      {printMode === 'shift' && closedShiftSummary ? (
        <div 
          className={`fixed top-0 left-0 -z-50 opacity-0 pointer-events-none print:static print:z-0 print:opacity-100 print:block p-3 bg-white text-black mx-auto ${
            settings.paper_width === '58mm' ? 'w-full max-w-[58mm] text-[11px]' : 'w-full max-w-[80mm] text-xs'
          } ${
            settings.font_family === 'sans' ? 'font-sans' :
            settings.font_family === 'serif' ? 'font-serif' :
            settings.font_family === 'courier' ? 'font-mono tracking-tighter' : 'font-mono'
          } ${
            settings.font_size === 'small' ? 'text-[10px]' :
            settings.font_size === 'large' ? 'text-[13px]' : 'text-[11.5px]'
          } ${
            settings.font_weight === 'bold' ? 'font-bold' : 'font-normal'
          }`}
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-black pb-3 mb-3">
            {settings.show_logo && settings.logo_url && (
              <div className="flex justify-center mb-2">
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-full border border-black/10"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <h1 className="text-base font-black uppercase tracking-tight">{settings.header_title || settings.business_name || 'Chuly Helados'}</h1>
            <p className="text-[11px] uppercase font-bold">CIERRE DE CAJA / ARQUEO Z</p>
            <p className="text-[10px] font-semibold mt-1">POS: {closedShiftSummary.pos_point_name || 'Caja Principal'}</p>
            <p className="text-[9px]">Turno #{closedShiftSummary.id} • Cajero: {closedShiftSummary.user_name || 'Cajero'}</p>
            {settings.business_address && <p className="text-[9px] mt-0.5">{settings.business_address}</p>}
            {settings.business_phone && <p className="text-[9px]">Tel: {settings.business_phone}</p>}
            <p className="text-[9px] mt-1 font-mono">Apertura: {new Date(closedShiftSummary.opened_at).toLocaleString()}</p>
            <p className="text-[9px] font-mono">Cierre: {closedShiftSummary.closed_at ? new Date(closedShiftSummary.closed_at).toLocaleString() : new Date().toLocaleString()}</p>
          </div>

          {/* Initial cash */}
          <div className="border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between font-bold text-[11px]">
              <span>FONDO INICIAL:</span>
              <span>{settings.currency_symbol}{Number(closedShiftSummary.initial_cash || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Sales breakdown */}
          <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
            <p className="font-bold text-[10px] uppercase border-b border-black pb-0.5 mb-1">
              Ventas por Medio de Pago ({closedShiftSummary.transaction_count || 0}):
            </p>
            <div className="flex justify-between text-[11px]">
              <span>(+) Efectivo:</span>
              <span className="font-bold">{settings.currency_symbol}{Number(closedShiftSummary.total_cash_sales || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>(+) Transferencia:</span>
              <span className="font-bold">{settings.currency_symbol}{Number(closedShiftSummary.total_transfer_sales || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>(+) Tarjeta:</span>
              <span className="font-bold">{settings.currency_symbol}{Number(closedShiftSummary.total_card_sales || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-black border-t border-black pt-1 mt-1">
              <span>TOTAL VENTAS:</span>
              <span>{settings.currency_symbol}{Number(closedShiftSummary.total_sales || 0).toLocaleString()}</span>
            </div>
            {Number(closedShiftSummary.total_expenses || 0) > 0 && (
              <div className="flex justify-between text-[11px] font-bold text-black pt-0.5">
                <span>(-) Gastos Pagados:</span>
                <span>-{settings.currency_symbol}{Number(closedShiftSummary.total_expenses || 0).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Balancing */}
          <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
            <p className="font-bold text-[10px] uppercase border-b border-black pb-0.5 mb-1">
              Cuadre y Arqueo de Caja:
            </p>
            <div className="flex justify-between text-[11px]">
              <span>Efectivo Esperado:</span>
              <span className="font-bold">{settings.currency_symbol}{Number(closedShiftSummary.expected_cash || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black">
              <span>Efectivo Real Contado:</span>
              <span>{settings.currency_symbol}{Number(closedShiftSummary.final_cash || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black border-t border-black pt-1">
              <span>Diferencia de Caja:</span>
              <span>
                {Number(closedShiftSummary.difference || 0) > 0 ? '+' : ''}{settings.currency_symbol}{Number(closedShiftSummary.difference || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {closedShiftSummary.notes && (
            <div className="text-[10px] border-b border-dashed border-black pb-2 mb-2">
              <span className="font-bold block">Observaciones:</span>
              <p>{closedShiftSummary.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 pb-2 text-center text-[9px]">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-t border-black pt-1">Firma Cajero</div>
              <div className="border-t border-black pt-1">Firma Responsable</div>
            </div>
            <p className="text-[8px] mt-4 opacity-60 uppercase">Comprobante No Fiscal</p>
          </div>
        </div>
      ) : lastSale ? (
        <div 
          className={`fixed top-0 left-0 -z-50 opacity-0 pointer-events-none print:static print:z-0 print:opacity-100 print:block p-3 bg-white text-black mx-auto ${
            settings.paper_width === '58mm' ? 'w-full max-w-[58mm] text-[11px]' : 'w-full max-w-[80mm] text-xs'
          } ${
            settings.font_family === 'sans' ? 'font-sans' :
            settings.font_family === 'serif' ? 'font-serif' :
            settings.font_family === 'courier' ? 'font-mono tracking-tighter' : 'font-mono'
          } ${
            settings.font_size === 'small' ? 'text-[10px]' :
            settings.font_size === 'large' ? 'text-[13px]' : 'text-[11.5px]'
          } ${
            settings.font_weight === 'bold' ? 'font-bold' : 'font-normal'
          }`}
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-black pb-3 mb-3">
            {settings.show_logo && settings.logo_url && (
              <div className="flex justify-center mb-2">
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-full border border-black/10"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <h1 className="text-base font-black uppercase tracking-tight">{settings.header_title || settings.business_name || 'Chuly Helados'}</h1>
            <p className="text-[10px] uppercase font-semibold">{settings.header_subtitle || 'Punto de Venta'}</p>
            {settings.business_address && <p className="text-[9px] mt-0.5">{settings.business_address}</p>}
            {settings.business_phone && <p className="text-[9px]">Tel: {settings.business_phone}</p>}
            {settings.tax_info && <p className="text-[8px] opacity-75">{settings.tax_info}</p>}
            <p className="text-[9px] mt-1.5 font-mono">{lastSale.date}</p>
          </div>

          {/* Order Details */}
          <div className="mb-3">
            <p className="font-bold text-xs border-b border-black mb-1.5 pb-0.5 uppercase tracking-wider">Detalle del Pedido:</p>
            <div className={`space-y-1.5 ${settings.line_spacing === 'compact' ? 'space-y-0.5' : settings.line_spacing === 'spacious' ? 'space-y-2.5' : 'space-y-1.5'}`}>
              <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider border-b border-black/40 pb-0.5 mb-1">
                <span>Producto</span>
                <span>Total</span>
              </div>
              {lastSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[10.5px]">
                  <div className="flex flex-col pr-1">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[9px] opacity-75">{item.quantity} x {settings.currency_symbol}{item.price.toLocaleString()}</span>
                  </div>
                  <span className="font-bold shrink-0">{settings.currency_symbol}{(item.quantity * item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payments */}
          <div className="border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between text-sm font-black border-b border-black/80 pb-0.5">
              <span>TOTAL</span>
              <span>{settings.currency_symbol}{lastSale.total.toLocaleString()}</span>
            </div>
            
            {settings.show_payment_details && (
              <div className="pt-2 text-[10px]">
                <p className="font-bold border-b border-black mb-1 pb-0.5 uppercase text-[9px]">Formas de Pago:</p>
                {lastSale.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.method}</span>
                    <span>{settings.currency_symbol}{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-5 pt-3 border-t border-dashed border-black">
            <p className="text-xs font-bold uppercase tracking-wider">{settings.footer_message}</p>
            {settings.show_seller && (
              <p className="text-[9px] mt-1 opacity-80">Atendido por: {currentUser?.name || 'Sistema'}</p>
            )}
            <p className="text-[8px] mt-0.5 opacity-50">Comprobante No Fiscal</p>
          </div>
        </div>
      ) : null}

      {/* New Category Modal */}
      <NewCategoryModal
        isOpen={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-brand-primary/10 text-brand-primary' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {icon}
      <span className="hidden lg:block font-medium">{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary hidden lg:block" />}
    </button>
  );
}
