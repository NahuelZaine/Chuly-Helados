import React, { useState } from 'react';
import { 
  Printer, 
  Type, 
  Store, 
  Save, 
  Check, 
  RotateCcw, 
  FileText, 
  HelpCircle, 
  Sparkles,
  Sliders,
  DollarSign,
  AlertTriangle,
  Phone,
  MapPin,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  Database,
  Cloud,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Server,
  Upload,
  Trash2,
  Plus,
  MonitorCheck,
  Edit,
  X,
  Tag
} from 'lucide-react';
import { AppSettings, User, PosPoint } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<boolean>;
  currentUser: User | null;
  onTestPrint: (customSettings?: AppSettings) => void;
}

export function SettingsView({ settings, onSaveSettings, currentUser, onTestPrint }: SettingsViewProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeSection, setActiveSection] = useState<'printer' | 'typography' | 'general' | 'supabase' | 'pos'>('printer');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Logo file upload ref & handler
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLogoError('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP)');
      return;
    }
    setLogoError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 300;
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/png', 0.9);
            handleChange('logo_url', compressed);
          } else {
            handleChange('logo_url', dataUrl);
          }
        };
        img.onerror = () => {
          handleChange('logo_url', dataUrl);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processLogoFile(file);
  };

  // POS Points State
  const [posPoints, setPosPoints] = useState<PosPoint[]>([]);
  const [isLoadingPos, setIsLoadingPos] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<PosPoint | null>(null);
  const [posForm, setPosForm] = useState({ name: '', label: '', description: '', active: true });
  const [posError, setPosError] = useState<string | null>(null);

  const loadPosPoints = async () => {
    setIsLoadingPos(true);
    try {
      const res = await fetch('/api/pos-points');
      if (res.ok) {
        const data = await res.json();
        setPosPoints(data);
      }
    } catch (err) {
      console.error('Error fetching POS points:', err);
    } finally {
      setIsLoadingPos(false);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'pos') {
      loadPosPoints();
    }
  }, [activeSection]);

  const handleOpenCreatePos = () => {
    setEditingPos(null);
    setPosForm({ name: '', label: '', description: '', active: true });
    setPosError(null);
    setShowPosModal(true);
  };

  const handleOpenEditPos = (pos: PosPoint) => {
    setEditingPos(pos);
    setPosForm({
      name: pos.name,
      label: pos.label || '',
      description: pos.description || '',
      active: Boolean(pos.active)
    });
    setPosError(null);
    setShowPosModal(true);
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.name.trim()) {
      setPosError('El nombre del punto de venta es obligatorio');
      return;
    }
    setPosError(null);
    try {
      if (editingPos) {
        const res = await fetch(`/api/pos-points/${editingPos.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(posForm)
        });
        if (!res.ok) throw new Error('Error al actualizar punto de venta');
      } else {
        const res = await fetch('/api/pos-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(posForm)
        });
        if (!res.ok) throw new Error('Error al crear punto de venta');
      }
      setShowPosModal(false);
      await loadPosPoints();
    } catch (err: any) {
      setPosError(err.message || 'Error al guardar');
    }
  };

  const handleDeletePos = async (id: number) => {
    if (!confirm('¿Deseas eliminar o desactivar este punto de venta?')) return;
    try {
      const res = await fetch(`/api/pos-points/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadPosPoints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    projectId: string;
    url: string;
    tables: Record<string, boolean>;
    readyCount: number;
    totalTables: number;
    allTablesReady: boolean;
    sqlSchema: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadSupabaseStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.error('Error fetching Supabase status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'supabase') {
      loadSupabaseStatus();
    }
  }, [activeSection]);

  const handleCopySql = () => {
    if (supabaseStatus?.sqlSchema) {
      navigator.clipboard.writeText(supabaseStatus.sqlSchema);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const parts = Object.entries(data.synced || {}).map(([k, v]) => `${k}: ${v}`);
        setSyncResult({
          success: true,
          message: `¡Sincronización completada con éxito! Elementos procesados (${parts.join(', ')}).`
        });
        loadSupabaseStatus();
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Error al sincronizar datos con Supabase.'
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Error de conexión con el servidor.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync if parent updates
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSavedSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const success = await onSaveSettings(formData);
    setIsSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('¿Deseas restaurar los valores de configuración a los recomendados por defecto?')) {
      const defaults: AppSettings = {
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
      setFormData(defaults);
      setSavedSuccess(false);
    }
  };

  // Font family helper class for preview
  const getFontFamilyClass = (family: string) => {
    switch (family) {
      case 'mono': return 'font-mono';
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      case 'courier': return 'font-mono tracking-tighter';
      default: return 'font-mono';
    }
  };

  // Font size helper class for preview
  const getFontSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-[11px] leading-tight';
      case 'large': return 'text-[14px] leading-snug';
      case 'normal':
      default: return 'text-[12px] leading-normal';
    }
  };

  // Line spacing class
  const getLineSpacingClass = (spacing: string) => {
    switch (spacing) {
      case 'compact': return 'space-y-1';
      case 'spacious': return 'space-y-3';
      case 'normal':
      default: return 'space-y-2';
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
              <Sliders size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800">Configuración</h1>
              <p className="text-sm text-slate-500">Impresora, tipografía, comandera y parámetros generales del negocio</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium text-xs flex items-center gap-2 shadow-sm"
            title="Restablecer valores predeterminados"
          >
            <RotateCcw size={15} />
            Restablecer
          </button>

          <button
            type="button"
            onClick={() => onTestPrint(formData)}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold text-xs flex items-center gap-2 shadow-sm"
          >
            <Printer size={16} />
            Imprimir Comanda de Prueba
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              savedSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-brand-primary text-white shadow-brand-primary/20 hover:bg-brand-primary/90'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={16} />
                ¡Cambios Guardados!
              </>
            ) : isSaving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save size={16} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid: Settings Tabs + Live Ticket Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Navigation & Settings Form */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Section Navigation Tabs */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
            <button
              onClick={() => setActiveSection('printer')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSection === 'printer'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Printer size={18} />
              Impresora y Comandera
            </button>
            <button
              onClick={() => setActiveSection('typography')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeSection === 'typography'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Type size={18} />
              Tipografía y Fuentes
            </button>
            <button
              onClick={() => setActiveSection('general')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeSection === 'general'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Store size={17} />
              Aspectos Generales
            </button>
            <button
              onClick={() => setActiveSection('supabase')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeSection === 'supabase'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database size={17} />
              Supabase Cloud
              <span className={`w-2 h-2 rounded-full ${supabaseStatus?.allTablesReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            </button>
            <button
              onClick={() => setActiveSection('pos')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeSection === 'pos'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MonitorCheck size={17} />
              Puntos de Venta
            </button>
          </div>

          {/* SECTION 1: IMPRESORA Y COMANDERA */}
          {activeSection === 'printer' && (
            <div className="space-y-6">
              
              {/* Paper Width & Format Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <Printer size={18} className="text-brand-primary" />
                      Ancho de Papel y Salida de Comandera
                    </h3>
                    <p className="text-xs text-slate-500">Selecciona el ancho del papel térmico de tu impresora</p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                    Térmica
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 80mm Option */}
                  <div
                    onClick={() => handleChange('paper_width', '80mm')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
                      formData.paper_width === '80mm'
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    {formData.paper_width === '80mm' && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={18} />
                        <span className="font-bold text-sm">80 mm (Estándar)</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Comanderas estándar de 3 pulgadas (Epson TM-T20/T88, Hasar, Bematech, Xprinter 80mm).
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-bold uppercase text-slate-400">Recomendado para mostrador</span>
                  </div>

                  {/* 58mm Option */}
                  <div
                    onClick={() => handleChange('paper_width', '58mm')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
                      formData.paper_width === '58mm'
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    {formData.paper_width === '58mm' && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={18} />
                        <span className="font-bold text-sm">58 mm (Mini / Portátil)</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Impresoras térmicas compactas de 2 pulgadas, impresoras Bluetooth o portátiles.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-bold uppercase text-slate-400">Formato compacto</span>
                  </div>
                </div>

                {/* Printer Port / Output target note */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Printer size={14} className="text-slate-400" />
                    Destino / Salida de la Comandera
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm text-slate-800 font-medium"
                    placeholder="Ej: Impresora Predeterminada del Sistema (USB / Red / COM)"
                    value={formData.printer_target_notes}
                    onChange={(e) => handleChange('printer_target_notes', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    Al cobrar una orden, el navegador abrirá el cuadro de diálogo de impresión listo para enviar a la comandera configurada.
                  </p>
                </div>
              </div>

              {/* Printing Behavior & Automation Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                  Comportamiento y Automatización de Venta
                </h3>

                <div className="space-y-4">
                  {/* Auto Print Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Auto-imprimir al finalizar la venta</h4>
                      <p className="text-xs text-slate-500">Abre automáticamente el cuadro de impresión de comanda tras confirmar el pago</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.auto_print}
                        onChange={(e) => handleChange('auto_print', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {/* Ticket Copies */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Cantidad de copias por venta</h4>
                      <p className="text-xs text-slate-500">Por ejemplo: 1 copia para el cliente, 2 copias para cliente y cocina</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleChange('ticket_copies', num)}
                          className={`w-9 h-8 rounded-lg font-bold text-xs transition-all ${
                            formData.ticket_copies === num
                              ? 'bg-brand-primary text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Seller */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Mostrar nombre del vendedor</h4>
                      <p className="text-xs text-slate-500">Imprime el usuario que registró la comanda</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_seller}
                        onChange={(e) => handleChange('show_seller', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {/* Show Payment Breakdown */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Mostrar desglose de formas de pago</h4>
                      <p className="text-xs text-slate-500">Detalla los montos pagados en efectivo, tarjeta o transferencia</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_payment_details}
                        onChange={(e) => handleChange('show_payment_details', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Ticket Branding & Text Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                  Textos y Logo del Ticket
                </h3>

                {/* Show Logo & URL */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Mostrar Logo en Comanda</h4>
                      <p className="text-xs text-slate-500">Imprime el logo circular en la parte superior</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_logo}
                        onChange={(e) => handleChange('show_logo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {formData.show_logo && (
                    <div className="space-y-4 pt-3 border-t border-slate-200">
                      {logoError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                          {logoError}
                        </div>
                      )}

                      {/* Logo Direct File Upload with Drag & Drop */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          const droppedFile = e.dataTransfer.files?.[0];
                          if (droppedFile) processLogoFile(droppedFile);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center gap-4 ${
                          isDraggingLogo 
                            ? 'border-brand-primary bg-brand-primary/5 border-dashed scale-[1.01]' 
                            : 'border-dashed border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {formData.logo_url ? (
                          <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group">
                            <img 
                              src={formData.logo_url} 
                              alt="Logo" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => handleChange('logo_url', '')}
                              className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
                              title="Eliminar logo"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon size={26} />
                            <span className="text-[9px] mt-1 font-bold">Sin logo</span>
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800">Subir Archivo de Logo Directamente</p>
                            {formData.logo_url && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Arrastra y suelta tu archivo de logo aquí o selecciónalo desde tu dispositivo (PNG, JPG, SVG o WebP)
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 pt-1.5">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-brand-primary text-white hover:bg-brand-primary/90 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                              <Upload size={14} />
                              <span>{formData.logo_url ? 'Cambiar Archivo de Logo' : 'Subir Archivo de Logo'}</span>
                            </button>
                            {formData.logo_url && (
                              <button
                                type="button"
                                onClick={() => handleChange('logo_url', '')}
                                className="px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Trash2 size={13} />
                                <span>Quitar Logo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* URL Fallback */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <ImageIcon size={13} />
                          O ingresar URL web del Logo
                        </label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                          placeholder="https://ejemplo.com/logo.png"
                          value={formData.logo_url}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleChange('logo_url', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Título / Encabezado</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.header_title}
                      onChange={(e) => handleChange('header_title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtítulo de Comanda</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.header_subtitle}
                      onChange={(e) => handleChange('header_subtitle', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensaje de Pie de Página</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="Ej: ¡Muchas gracias por elegirnos!"
                    value={formData.footer_message}
                    onChange={(e) => handleChange('footer_message', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TIPOGRAFÍA Y FUENTES */}
          {activeSection === 'typography' && (
            <div className="space-y-6">
              
              {/* Font Family Selection */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Type size={18} className="text-brand-primary" />
                    Familia de Fuente de la Comandera
                  </h3>
                  <p className="text-xs text-slate-500">Elige la tipografía con la que se imprimirán los tickets</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'mono', label: 'Monospace (Térmica Clásica)', sub: 'Alineación perfecta por columnas', sample: 'Helado 1kg $12.000', fontClass: 'font-mono' },
                    { id: 'sans', label: 'Sans-Serif (Moderna y Limpia)', sub: 'Diseño pulcro y minimalista', sample: 'Helado 1kg $12.000', fontClass: 'font-sans' },
                    { id: 'courier', label: 'Courier New (Máquina)', sub: 'Estilo clásico y contundente', sample: 'Helado 1kg $12.000', fontClass: 'font-mono tracking-tight' },
                    { id: 'serif', label: 'Serif (Tradicional)', sub: 'Toque artesanal y distintivo', sample: 'Helado 1kg $12.000', fontClass: 'font-serif' },
                  ].map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleChange('font_family', f.id as any)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        formData.font_family === f.id
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs">{f.label}</span>
                        {formData.font_family === f.id && (
                          <Check size={14} strokeWidth={3} className="text-brand-primary" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{f.sub}</p>
                      <div className={`p-2 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-800 ${f.fontClass}`}>
                        {f.sample}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Size & Weight */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                  Tamaño y Grosor de Texto
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Size */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tamaño de Fuente
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                      {[
                        { id: 'small', label: 'Pequeño', desc: '11px' },
                        { id: 'normal', label: 'Normal', desc: '12px' },
                        { id: 'large', label: 'Grande', desc: '14px' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleChange('font_size', s.id as any)}
                          className={`py-2 px-1 rounded-xl text-center transition-all ${
                            formData.font_size === s.id
                              ? 'bg-white text-brand-primary font-bold shadow-sm border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="text-xs">{s.label}</div>
                          <div className="text-[10px] text-slate-400">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Interlineado / Espaciado
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                      {[
                        { id: 'compact', label: 'Compacto', desc: 'Ahorro' },
                        { id: 'normal', label: 'Normal', desc: 'Equilibrado' },
                        { id: 'spacious', label: 'Espaciado', desc: 'Holgado' },
                      ].map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleChange('line_spacing', sp.id as any)}
                          className={`py-2 px-1 rounded-xl text-center transition-all ${
                            formData.line_spacing === sp.id
                              ? 'bg-white text-brand-primary font-bold shadow-sm border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <div className="text-xs">{sp.label}</div>
                          <div className="text-[10px] text-slate-400">{sp.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font Weight */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Texto en Negrita Reforzada</h4>
                    <p className="text-xs text-slate-500">Mayor contraste para cabezales de impresión gastados o con baja tinta térmica</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.font_weight === 'bold'}
                      onChange={(e) => handleChange('font_weight', e.target.checked ? 'bold' : 'normal')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ASPECTOS GENERALES */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              
              {/* Business Profile */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Store size={18} className="text-brand-primary" />
                    Identidad y Datos del Comercio
                  </h3>
                  <p className="text-xs text-slate-500">Información visible en la plataforma y en los comprobantes impresos</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre de la Heladería / Local</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rubro / Subtítulo</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.business_subtitle}
                      onChange={(e) => handleChange('business_subtitle', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      Dirección del Local
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.business_address}
                      onChange={(e) => handleChange('business_address', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      Teléfono / WhatsApp de Contacto
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.business_phone}
                      onChange={(e) => handleChange('business_phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Condición Fiscal / CUIT / RUT (Opcional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="Ej: IVA Responsable Inscripto - CUIT: 30-12345678-9"
                    value={formData.tax_info || ''}
                    onChange={(e) => handleChange('tax_info', e.target.value)}
                  />
                </div>
              </div>

              {/* Financial & Inventory Parameters */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                  Parámetros Monetarios y de Stock
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <DollarSign size={13} className="text-slate-400" />
                      Símbolo de Moneda
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      placeholder="$"
                      value={formData.currency_symbol}
                      onChange={(e) => handleChange('currency_symbol', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-amber-500" />
                      Alerta de Stock Bajo (Umbral)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      value={formData.low_stock_threshold}
                      onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Los productos con cantidad igual o menor a este valor se marcarán con aviso de reposición.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SUPABASE CLOUD */}
          {activeSection === 'supabase' && (
            <div className="space-y-6">
              
              {/* Connection Status Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                      <Cloud size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        Base de Datos Supabase (Cloud PostgreSQL)
                      </h3>
                      <p className="text-xs text-slate-500">Conexión de sincronización en la nube en tiempo real</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadSupabaseStatus}
                      disabled={isLoadingStatus}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Comprobar conexión en vivo"
                    >
                      <RefreshCw size={14} className={isLoadingStatus ? "animate-spin" : ""} />
                      {isLoadingStatus ? "Verificando..." : "Comprobar"}
                    </button>
                    <a
                      href={`https://supabase.com/dashboard/project/${supabaseStatus?.projectId || 'zsirhvqjatpjulyllwtb'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Dashboard
                    </a>
                  </div>
                </div>

                {/* Status Indicator Banner */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  supabaseStatus?.allTablesReady 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  {supabaseStatus?.allTablesReady ? (
                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">
                        {supabaseStatus?.allTablesReady 
                          ? 'Supabase Conectado y 100% Operativo' 
                          : 'Conexión a Supabase Activa — Tablas Pendientes de Creación'}
                      </h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        supabaseStatus?.allTablesReady 
                          ? 'bg-emerald-200 text-emerald-800' 
                          : 'bg-amber-200 text-amber-800'
                      }`}>
                        {supabaseStatus ? `${supabaseStatus.readyCount} de ${supabaseStatus.totalTables} tablas listas` : 'Verificando...'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-90">
                      {supabaseStatus?.allTablesReady 
                        ? 'Todas las tablas y políticas de seguridad en la nube están listas. Los cambios se sincronizan automáticamente en Supabase.'
                        : 'El proyecto responde correctamente. Para comenzar a persistir en la nube, copia el script SQL que figura abajo y ejecútalo en el SQL Editor de tu Supabase.'}
                    </p>
                  </div>
                </div>

                {/* Credentials details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project ID</span>
                    <p className="font-mono text-xs font-bold text-slate-800 truncate">
                      {supabaseStatus?.projectId || 'zsirhvqjatpjulyllwtb'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URL del Proyecto</span>
                    <p className="font-mono text-xs font-semibold text-slate-700 truncate">
                      {supabaseStatus?.url || 'https://zsirhvqjatpjulyllwtb.supabase.co'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Checklist */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Server size={18} className="text-brand-primary" />
                      Estado de Tablas en Supabase
                    </h3>
                    <p className="text-xs text-slate-500">Módulos del punto de venta conectados a PostgreSQL</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {supabaseStatus ? `${supabaseStatus.readyCount}/${supabaseStatus.totalTables}` : '-'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {supabaseStatus && Object.entries(supabaseStatus.tables).map(([table, ready]) => (
                    <div 
                      key={table}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        ready 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-mono font-bold">{table}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ready 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {ready ? 'Lista' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SQL Setup Script Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <FileText size={18} className="text-brand-primary" />
                      Script SQL de Inicialización para Supabase
                    </h3>
                    <p className="text-xs text-slate-500">Crea las tablas, claves foráneas y políticas de seguridad RLS</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                      copiedSql 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                    }`}
                  >
                    {copiedSql ? <Check size={15} /> : <Copy size={15} />}
                    {copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}
                  </button>
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs max-h-56 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner select-all">
                  <pre className="whitespace-pre-wrap">{supabaseStatus?.sqlSchema || '-- Cargando esquema...'}</pre>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-700">Instrucciones paso a paso:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    <li>Haz clic en el botón <strong>"Copiar Script SQL"</strong> de arriba.</li>
                    <li>Abre el <strong>SQL Editor</strong> en tu panel de Supabase.</li>
                    <li>Pega el código y presiona <strong>"Run"</strong> para crear la estructura.</li>
                    <li>Vuelve a esta pantalla y haz clic en <strong>"Comprobar"</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Cloud Sync & Migration Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <RefreshCw size={18} className="text-brand-primary" />
                    Migrar y Sincronizar Datos Locales a Supabase
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sube todo tu catálogo actual de sabores, precios, usuarios y configuraciones a la nube
                  </p>
                </div>

                {syncResult && (
                  <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    syncResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {syncResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{syncResult.message}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <span className="text-xs text-slate-500">
                    Sube categorías, helados, precios y usuarios existentes al proyecto cloud de Supabase.
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncing}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Sincronizando con Supabase..." : "Sincronizar Datos a Supabase"}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 5: PUNTOS DE VENTA (POS) */}
          {activeSection === 'pos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
                      <MonitorCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        Puntos de Venta y Cajas Registradoras
                      </h3>
                      <p className="text-xs text-slate-500">
                        Administra terminales, cajas mostrador y dispositivos móviles
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCreatePos}
                    className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Agregar Punto de Venta</span>
                  </button>
                </div>

                {isLoadingPos ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Cargando puntos de venta...</div>
                ) : posPoints.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No hay puntos de venta configurados. Haz clic en "Agregar Punto de Venta" para crear uno.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posPoints.map((pos) => (
                      <div
                        key={pos.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          pos.active
                            ? 'bg-white border-slate-200 hover:border-brand-primary/50 shadow-sm'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-sm">{pos.name}</h4>
                              {pos.label && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-md border border-slate-200">
                                  {pos.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {pos.description || 'Sin descripción adicional'}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              pos.active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {pos.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPos(pos)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit size={13} />
                            <span>Modificar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePos(pos.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Eliminar o desactivar"
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Save Reminder bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <span className="text-xs text-slate-500">Recuerda guardar los cambios para aplicarlos en todas las terminales.</span>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-primary text-white hover:bg-brand-primary/90'
              }`}
            >
              {savedSuccess ? <Check size={16} /> : <Save size={16} />}
              {savedSuccess ? '¡Guardado!' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Thermal Ticket Mockup or Supabase Cloud Architecture or POS */}
        <div className="xl:col-span-5 space-y-4">
          {activeSection === 'pos' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MonitorCheck size={16} className="text-brand-primary" />
                  Control de Cajas y Terminales
                </h3>
                <span className="text-[11px] font-mono font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md">
                  Puntos de Venta
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">¿Cómo funcionan los Puntos de Venta?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cada punto de venta representa una caja física (mostrador, barra) o terminal móvil (tablet, smartphone) donde se registran cobros y turnos de caja.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">1. Apertura de Caja por Turno</span>
                    <p className="text-slate-500">Al iniciar la jornada, el cajero selecciona su Punto de Venta e ingresa el dinero disponible / fondo inicial de cambio.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">2. Registro de Transacciones</span>
                    <p className="text-slate-500">Todas las ventas (efectivo, tarjeta, transferencia) y gastos se vinculan automáticamente al punto de venta y turno abierto.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">3. Cierre y Arqueo con Ticket Z</span>
                    <p className="text-slate-500">Al cerrar el turno, el sistema emite el comprobante de cierre de caja con el desglose exacto por medio de pago y calcula sobrantes o faltantes.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSection === 'supabase' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Cloud size={16} className="text-emerald-600" />
                  Arquitectura Multi-Dispositivo
                </h3>
                <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  PostgreSQL Cloud
                </span>
              </div>

              {/* Multi-device sync explanation card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Base de Datos Centralizada</h4>
                    <p className="text-xs text-slate-500">Un solo origen de datos para toda la heladería</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Al conectar <strong>Supabase</strong>, todas las terminales (computadoras de caja, tablets de mostrador y smartphones) comparten el mismo inventario, lista de precios y registro de ventas en tiempo real.
                </p>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Sincronización instantánea de stock:</strong> cuando un cajero vende 1kg de helado, el stock se descuenta en todas las pantallas.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Precios y productos unificados:</strong> modifica un sabor o su precio y se reflejará al instante en todas las tablets.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Modo Híbrido Resiliente:</strong> si hay cortes de internet, el sistema continúa cobrando localmente y actualiza la nube al reconectar.</span>
                  </div>
                </div>
              </div>

              {/* Endpoint Information */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl space-y-3 font-mono text-xs shadow-md border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-sans text-[11px] font-bold uppercase tracking-wider">Parámetros REST Supabase</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    Activo
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Base Endpoint:</span>
                    <span className="text-emerald-300 break-all">{supabaseStatus?.url || 'https://zsirhvqjatpjulyllwtb.supabase.co'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">REST Endpoint:</span>
                    <span className="text-slate-300 break-all">{supabaseStatus?.url ? `${supabaseStatus.url}/rest/v1` : '...'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Client SDK:</span>
                    <span className="text-slate-300">@supabase/supabase-js v2</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                <HelpCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Respaldos Automáticos en la Nube:</span>
                  Supabase realiza copias de seguridad continuas de tu PostgreSQL, asegurando que tus ventas e historial de caja estén siempre a salvo.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Eye size={16} className="text-brand-primary" />
                  Previsualización en Vivo de Comanda
                </h3>
                <span className="text-[11px] font-mono font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md">
                  {formData.paper_width} | {formData.font_family}
                </span>
              </div>

              {/* Realistic Receipt Paper Simulation */}
              <div className="bg-slate-200/60 p-6 rounded-3xl border border-slate-300/80 flex justify-center shadow-inner">
                <div 
                  className={`bg-white text-black p-5 shadow-2xl rounded-sm transition-all duration-300 relative ${
                    formData.paper_width === '58mm' ? 'w-[240px]' : 'w-[320px]'
                  } ${getFontFamilyClass(formData.font_family)} ${getFontSizeClass(formData.font_size)} ${
                    formData.font_weight === 'bold' ? 'font-bold' : 'font-normal'
                  }`}
                >
                  {/* Receipt Top Zigzag effect */}
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-repeat-x bg-[radial-gradient(circle,transparent_4px,white_4px)] bg-[length:12px_12px] rotate-180 opacity-90"></div>

                  {/* Logo */}
                  {formData.show_logo && formData.logo_url && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-16 h-16 object-contain rounded-full border border-black/10"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Header */}
                  <div className="text-center border-b border-dashed border-black pb-3 mb-3">
                    <h2 className="text-base font-black uppercase tracking-tight">{formData.header_title || 'Chuly Helados'}</h2>
                    <p className="text-[10px] uppercase font-semibold opacity-80">{formData.header_subtitle || 'Comanda de Venta'}</p>
                    {formData.business_address && <p className="text-[9px] mt-1 opacity-75">{formData.business_address}</p>}
                    {formData.business_phone && <p className="text-[9px] opacity-75">Tel: {formData.business_phone}</p>}
                    {formData.tax_info && <p className="text-[8px] opacity-60 mt-0.5">{formData.tax_info}</p>}
                    <p className="text-[10px] mt-2 font-mono">{new Date().toLocaleString()}</p>
                  </div>

                  {/* Order Items Mock */}
                  <div className="mb-3">
                    <div className="flex justify-between font-bold text-[10px] uppercase border-b border-black/60 pb-1 mb-1.5 tracking-wider">
                      <span>Producto</span>
                      <span>Total</span>
                    </div>

                    <div className={getLineSpacingClass(formData.line_spacing)}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold">1kg Helado (3 sabores)</span>
                          <span className="text-[9px] opacity-75">1 x {formData.currency_symbol}12.000</span>
                        </div>
                        <span className="font-bold">{formData.currency_symbol}12.000</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold">Cucurucho Simple</span>
                          <span className="text-[9px] opacity-75">2 x {formData.currency_symbol}2.500</span>
                        </div>
                        <span className="font-bold">{formData.currency_symbol}5.000</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold">Agua Mineral 500ml</span>
                          <span className="text-[9px] opacity-75">1 x {formData.currency_symbol}1.200</span>
                        </div>
                        <span className="font-bold">{formData.currency_symbol}1.200</span>
                      </div>
                    </div>
                  </div>

                  {/* Total & Payments */}
                  <div className="border-t border-dashed border-black pt-2.5 space-y-2">
                    <div className="flex justify-between text-sm font-black border-b border-black/80 pb-1">
                      <span>TOTAL</span>
                      <span>{formData.currency_symbol}18.200</span>
                    </div>

                    {formData.show_payment_details && (
                      <div className="text-[10px] space-y-0.5 pt-1">
                        <p className="font-bold uppercase text-[8px] opacity-70">Formas de Pago:</p>
                        <div className="flex justify-between">
                          <span>Efectivo</span>
                          <span>{formData.currency_symbol}10.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transferencia</span>
                          <span>{formData.currency_symbol}8.200</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-5 pt-3 border-t border-dashed border-black">
                    <p className="text-xs font-bold uppercase tracking-wide">{formData.footer_message}</p>
                    {formData.show_seller && (
                      <p className="text-[9px] mt-1.5 opacity-75">
                        Atendido por: {currentUser?.name || 'Nahuel Zaine'}
                      </p>
                    )}
                    <p className="text-[8px] mt-1 opacity-50">Comprobante No Fiscal</p>
                  </div>

                  {/* Receipt Bottom Zigzag */}
                  <div className="absolute -bottom-2 left-0 right-0 h-2 bg-repeat-x bg-[radial-gradient(circle,transparent_4px,white_4px)] bg-[length:12px_12px] opacity-90"></div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <HelpCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Consejo para Comanderas Térmicas:</span>
                  En el diálogo de impresión de Chrome/Edge/Firefox, selecciona "Márgenes: Ninguno" y desmarca "Encabezados y pies de página" para obtener un corte de papel perfecto y continuo.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* POS Point Modal (Create / Edit) */}
      {showPosModal && (
        <div 
          onClick={() => setShowPosModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-100"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <MonitorCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-800">
                    {editingPos ? 'Modificar Punto de Venta' : 'Nuevo Punto de Venta'}
                  </h3>
                  <p className="text-xs text-slate-500">Terminal o caja para control de arqueo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPosModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePos} className="p-6 space-y-4">
              {posError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {posError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nombre del Punto de Venta *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  value={posForm.name}
                  onChange={(e) => setPosForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Caja Mostrador, Tablet Barra, Móvil 1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag size={13} />
                  Etiqueta / Código Corto (Opcional)
                </label>
                <input
                  type="text"
                  value={posForm.label}
                  onChange={(e) => setPosForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: POS-01, CAJA-02, TAB-01"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Descripción o Ubicación (Opcional)
                </label>
                <input
                  type="text"
                  value={posForm.description}
                  onChange={(e) => setPosForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Mostrador principal al frente del salón"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Punto de Venta Activo</span>
                  <span className="text-[11px] text-slate-400">Disponible para aperturas de caja y cobros</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={posForm.active}
                    onChange={(e) => setPosForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-primary/20 cursor-pointer"
                >
                  Guardar Punto de Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
