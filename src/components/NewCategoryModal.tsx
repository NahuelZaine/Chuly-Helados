import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderPlus, X, Check, Tag } from 'lucide-react';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (newCategoryId: number, newCategoryName: string) => void;
}

export function NewCategoryModal({ isOpen, onClose, onCategoryCreated }: NewCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setError('Por favor ingresa un nombre para la categoría');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear la categoría');
      }

      const data = await res.json();
      setCategoryName('');
      onCategoryCreated(data.id, trimmed);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al crear la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-100 cursor-default"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <FolderPlus size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-800">Nueva Categoría</h2>
                  <p className="text-xs text-slate-500">Crea una categoría para organizar tus productos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag size={14} className="text-slate-400" />
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  placeholder="Ej: Tortas Heladas, Postres, Dulces..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !categoryName.trim()}
                  className="flex-1 py-3.5 px-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Check size={18} />
                  {isSubmitting ? 'Creando...' : 'Crear y Seleccionar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
