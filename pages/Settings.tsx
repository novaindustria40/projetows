
import React, { useState } from 'react';
import { Moon, Sun, CreditCard, MapPin, Lock, User as UserIcon, Tag, Plus, Trash2 } from 'lucide-react';
import { ThemeContextType } from '../types';

interface SettingsProps {
  user: any;
  theme: ThemeContextType;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const Settings: React.FC<SettingsProps> = ({ user, theme, categories, setCategories }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie seu perfil, assinatura e preferências.</p>
      </div>

      {/* Message Categories Management */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" /> Categorias de Mensagens
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Crie categorias para organizar suas mensagens e campanhas.</p>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..." 
            className="flex-1 rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
          <button 
            onClick={handleAddCategory}
            disabled={!newCategory}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat} className="group flex items-center bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600">
              {cat}
              <button 
                onClick={() => handleDeleteCategory(cat)}
                className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences / Theme */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" /> Aparência
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Tema do Sistema</p>
            <p className="text-sm text-gray-500">Alterne entre modo claro e escuro.</p>
          </div>
          <button 
            onClick={theme.toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span className={`
              ${theme.isDark ? 'translate-x-6 bg-slate-800' : 'translate-x-1 bg-white'} 
              inline-block h-4 w-4 transform rounded-full transition-transform flex items-center justify-center
            `}>
              {theme.isDark ? <Moon size={10} className="text-white" /> : <Sun size={10} className="text-yellow-500" />}
            </span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <UserIcon className="w-5 h-5" /> Dados Cadastrais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
            <input type="text" defaultValue={user.name} className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" defaultValue={user.email} className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
            <input type="text" defaultValue={user.companyName} className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
            <input type="tel" placeholder="+55 11 99999-9999" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </div>

      {/* Address & Billing */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Endereço e Faturamento
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logradouro</label>
               <input type="text" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
               <input type="text" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
               <input type="text" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
               <input type="text" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
               <input type="text" className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2.5 dark:text-white" />
             </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Forma de Pagamento
          </h3>
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
             <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
             <div className="flex-1">
               <p className="text-sm font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
               <p className="text-xs text-gray-500">Expira em 12/24</p>
             </div>
             <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Alterar</button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" /> Segurança
        </h2>
        <div className="flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-gray-900 dark:text-white">Senha</p>
             <p className="text-xs text-gray-500">Última alteração há 3 meses</p>
           </div>
           <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white">
             Alterar Senha
           </button>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg shadow-primary-600/20 transition-all">
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default Settings;
