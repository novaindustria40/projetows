
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Calendar as CalIcon, Users, Play, Pause, Edit, List, MessageCircle, Trash2, Clock, X, FilterX, Loader2, Save } from 'lucide-react';
import { Campaign, ContactList, WhatsappGroup } from '../types';

const Campaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'contacts' | 'groups'>('campaigns');
  
  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data States
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsappGroup[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Campaign Form State
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDate, setNewCampaignDate] = useState('');
  const [newCampaignSchedules, setNewCampaignSchedules] = useState<string[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingCampaignRaw, setEditingCampaignRaw] = useState<any | null>(null);
  const [originalMessageContent, setOriginalMessageContent] = useState<string | null>(null);
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null);

  // Contact List Form State
  const [newListName, setNewListName] = useState('');
  const [newContactNumbers, setNewContactNumbers] = useState(''); // Text area input

  const API_URL = '/api';

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') fetchContacts();
    if (activeTab === 'groups') fetchGroups();
    if (isCampaignModalOpen) {
      fetchContacts();
      fetchGroups();
      fetchWhatsappContacts();
      fetchTemplates();
    }
  }, [activeTab, isCampaignModalOpen]);

  const fetchWhatsappContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/whatsapp/contacts`);
      if (!res.ok) throw new Error('Failed to fetch whatsapp contacts');
      const data = await res.json();
      setWhatsappContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading whatsapp contacts', err);
      setWhatsappContacts([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/messages`);
      if (!res.ok) return setTemplates([]);
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates', err);
      setTemplates([]);
    }
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/campaigns`);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      const mappedData = data.map((c: any) => ({
        ...c,
        id: c._id,
        schedules: c.schedules.map((d: string) => new Date(d).toLocaleString())
      }));
      setCampaigns(mappedData);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      // Map backend data to frontend interface
      setContactLists(data.map((l: any) => ({ 
        ...l, 
        id: l._id, 
        count: l.contacts?.length || 0, 
        lastUpdated: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Hoje' 
      })));
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/whatsapp/groups`);
      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setWhatsappGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName || (!selectedTemplateId && !originalMessageContent && !editingCampaignRaw)) {
      window.alert('Preencha o nome e selecione um modelo.');
      return;
    }
    if (selectedListIds.length === 0 && selectedGroupIds.length === 0 && selectedContacts.length === 0) {
      window.alert('Selecione pelo menos um destinatário (lista, grupo ou contato).');
      return;
    }
    if (newCampaignSchedules.length === 0) {
      window.alert('Adicione pelo menos um agendamento antes de salvar a campanha.');
      return;
    }
    setIsSaving(true);

    try {
      // If editing an existing campaign, perform update for that campaign id
      if (editingCampaignId && editingCampaignRaw) {
        const schedules = newCampaignSchedules.map(s => new Date(s).toISOString());
        const payload = {
          name: newCampaignName,
          // keep existing messageContent/mediaUrl
          messageContent: editingCampaignRaw.messageContent,
          mediaUrl: editingCampaignRaw.mediaUrl,
          schedules,
          status: schedules.length > 0 ? 'scheduled' : 'draft'
        };
        const res = await fetch(`${API_URL}/campaigns/${editingCampaignId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          await fetchCampaigns();
          setIsCampaignModalOpen(false);
          resetCampaignForm();
        }
        return;
      }

      const tpl = templates.find(t => t._id === selectedTemplateId || t.id === selectedTemplateId);
      const messageContent = tpl?.content || originalMessageContent || '';
      const mediaUrl = tpl?.mediaUrl || originalMediaUrl;

      const schedules = newCampaignSchedules.map(s => new Date(s).toISOString());

      const createdCampaigns: any[] = [];

      // 1) Create campaigns for selected saved lists
      for (const listId of selectedListIds) {
        const list = contactLists.find(l => l.id === listId);
        const payload = {
          name: newCampaignName,
          messageContent,
          mediaUrl,
          targetType: 'list',
          targetId: listId,
          targetName: list?.name || 'Lista',
          targetCount: list?.count || 0,
          schedules,
          status: schedules.length > 0 ? 'scheduled' : 'draft'
        };
        const res = await fetch(`${API_URL}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) createdCampaigns.push(await res.json());
      }

      // 2) Create a temporary ContactList if raw whatsapp contacts selected
      if (selectedContacts.length > 0) {
        const contactsPayload = selectedContacts.map(id => {
          const c = whatsappContacts.find(w => w.id === id) || {};
          return { phone: c.phone || c.id, name: c.name || '' };
        }).filter(Boolean);

        const listRes = await fetch(`${API_URL}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Campanha: ${newCampaignName}`, contacts: contactsPayload }) });
        if (listRes.ok) {
          const listData = await listRes.json();
          const payload = {
            name: newCampaignName,
            messageContent,
            mediaUrl,
            targetType: 'list',
            targetId: listData._id || listData.id,
            targetName: listData.name,
            targetCount: contactsPayload.length,
            schedules,
            status: schedules.length > 0 ? 'scheduled' : 'draft'
          };
          const res = await fetch(`${API_URL}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) createdCampaigns.push(await res.json());
        }
      }

      // 3) Create campaigns for each selected WhatsApp group
      for (const groupId of selectedGroupIds) {
        const group = whatsappGroups.find(g => g.id === groupId);
        const payload = {
          name: newCampaignName,
          messageContent,
          mediaUrl,
          targetType: 'group',
          targetId: groupId,
          targetName: group?.name || 'Grupo',
          targetCount: group?.participants || 0,
          schedules,
          status: schedules.length > 0 ? 'scheduled' : 'draft'
        };
        const res = await fetch(`${API_URL}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) createdCampaigns.push(await res.json());
      }

      if (createdCampaigns.length > 0) {
        await fetchCampaigns();
        setIsCampaignModalOpen(false);
        resetCampaignForm();
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName || !newContactNumbers) return;
    setIsSaving(true);

    // Parse CSV/Text area
    // Format: "11999999999, Name" or just number per line
    const lines = newContactNumbers.split('\n');
    const contacts = lines.map(line => {
      const [phone, name] = line.split(',');
      if (!phone) return null;
      // Clean phone
      const cleanPhone = phone.replace(/\D/g, '');
      return {
        phone: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`,
        name: name ? name.trim() : 'Sem nome'
      };
    }).filter(Boolean);

    try {
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName, contacts })
      });

      if (res.ok) {
        await fetchContacts();
        setIsContactModalOpen(false);
        setNewListName('');
        setNewContactNumbers('');
      }
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const resetCampaignForm = () => {
    setNewCampaignName('');
    setSelectedTemplateId(null);
    setSelectedContacts([]);
    setSelectedGroupIds([]);
    setSelectedListIds([]);
    setNewCampaignSchedules([]);
    setNewCampaignDate('');
    setEditingCampaignId(null);
    setEditingCampaignRaw(null);
    setOriginalMessageContent(null);
    setOriginalMediaUrl(null);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'all' || campaign.targetType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, searchTerm, statusFilter, typeFilter]);

  const addSchedule = () => {
    if (newCampaignDate && !newCampaignSchedules.includes(newCampaignDate)) {
      setNewCampaignSchedules([...newCampaignSchedules, newCampaignDate]);
      setNewCampaignDate('');
    }
  };

  const removeSchedule = (dateToRemove: string) => {
    setNewCampaignSchedules(newCampaignSchedules.filter(d => d !== dateToRemove));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Envios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie campanhas, listas de contatos e grupos.</p>
        </div>
        {activeTab === 'campaigns' && (
          <button 
            onClick={() => setIsCampaignModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Campanha
          </button>
        )}
        {activeTab === 'contacts' && (
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors shadow-md dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Lista
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
        {[
          { id: 'campaigns', label: 'Campanhas', icon: CalIcon },
          { id: 'contacts', label: 'Listas de Contatos', icon: List },
          { id: 'groups', label: 'Grupos WhatsApp', icon: MessageCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
            `}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar campanhas..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                {showFilters ? <FilterX className="w-4 h-4 mr-2" /> : <Filter className="w-4 h-4 mr-2" />}
                Filtros
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-4 animate-fade-in">
                 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 dark:text-white">
                   <option value="all">Todos Status</option>
                   <option value="scheduled">Agendados</option>
                   <option value="running">Enviando</option>
                   <option value="completed">Concluídos</option>
                 </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                    <th className="px-6 py-4">Campanha</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Destino</th>
                    <th className="px-6 py-4">Progresso</th>
                    <th className="px-6 py-4">Agendamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {isLoading ? (
                     <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
                  ) : filteredCampaigns.map((c) => (
                     <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                       <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{c.targetName} ({c.targetCount})</td>
                       <td className="px-6 py-4 text-sm">
                          <span className="text-green-600">{c.sentCount} env.</span> / <span className="text-red-500">{c.failedCount} falhas</span>
                       </td>
                                 <td className="px-6 py-4 text-xs text-gray-500">{c.schedules && c.schedules[0] ? (Array.isArray(c.schedules) ? (typeof c.schedules[0] === 'string' ? c.schedules[0] : new Date(c.schedules[0]).toLocaleString()) : 'N/A') : 'N/A'}</td>
                                 <td className="px-6 py-4 text-right space-x-2">
                                   <button title="Editar" onClick={async () => {
                                     // fetch raw campaign and open modal for edit
                                     const res = await fetch(`${API_URL}/campaigns/${c._id || c.id}`);
                                     if (!res.ok) return;
                                     const data = await res.json();
                                     setEditingCampaignId(data._id || data.id);
                                     setEditingCampaignRaw(data);
                                     setNewCampaignName(data.name || '');
                                     // prefill recipients selection
                                     if (data.targetType === 'list') setSelectedListIds([data.targetId]);
                                     else if (data.targetType === 'group') setSelectedGroupIds([data.targetId]);
                                     // prefill schedules as input-friendly values? leave empty so user adds new ones
                                     setNewCampaignSchedules([]);
                                     setIsCampaignModalOpen(true);
                                   }} className="text-sm text-primary-600 hover:underline">Editar</button>

                                   <button title="Cancelar envio" onClick={async () => {
                                     if (!confirm('Cancelar envio desta campanha? Isso removerá os agendamentos.')) return;
                                     const id = c._id || c.id;
                                     const res = await fetch(`${API_URL}/campaigns/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft', schedules: [] }) });
                                     if (res.ok) await fetchCampaigns();
                                   }} className="text-sm text-yellow-600 hover:underline">Cancelar</button>

                                   <button title="Reutilizar" onClick={async () => {
                                     // open modal prefilled for reuse (create new)
                                     const res = await fetch(`${API_URL}/campaigns/${c._id || c.id}`);
                                     if (!res.ok) return;
                                     const data = await res.json();
                                     setEditingCampaignId(null);
                                     setEditingCampaignRaw(null);
                                     setOriginalMessageContent(data.messageContent || null);
                                     setOriginalMediaUrl(data.mediaUrl || null);
                                     // prefill recipients
                                     if (data.targetType === 'list') setSelectedListIds([data.targetId]);
                                     else if (data.targetType === 'group') setSelectedGroupIds([data.targetId]);
                                     setNewCampaignName(`${data.name} (reuse)`);
                                     setNewCampaignSchedules([]);
                                     setIsCampaignModalOpen(true);
                                   }} className="text-sm text-blue-600 hover:underline">Reutilizar</button>

                                   <button title="Deletar" onClick={async () => {
                                     if (!confirm('Tem certeza que deseja deletar esta campanha?')) return;
                                     const id = c._id || c.id;
                                     const res = await fetch(`${API_URL}/campaigns/${id}`, { method: 'DELETE' });
                                     if (res.ok) await fetchCampaigns();
                                   }} className="text-sm text-red-600 hover:underline">Deletar</button>
                                 </td>
                     </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        </>
      )}

      {/* Tab Content: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {contactLists.map(list => (
             <div key={list.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 group">
               <div className="flex items-start justify-between mb-4">
                 <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                   <List className="w-6 h-6" />
                 </div>
               </div>
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{list.name}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Atualizado: {list.lastUpdated}</p>
               <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                 <Users className="w-4 h-4 mr-2 text-gray-500" />
                 {list.count} Contatos
               </div>
             </div>
           ))}
           {contactLists.length === 0 && (
             <div className="col-span-3 text-center py-12 text-gray-500">Nenhuma lista de contatos encontrada. Crie uma para começar.</div>
           )}
        </div>
      )}

      {/* Tab Content: GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {whatsappGroups.length > 0 ? whatsappGroups.map(group => (
             <div key={group.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                   <img src={`https://ui-avatars.com/api/?name=${group.name}&background=random`} alt="Group" />
                 </div>
                 <div>
                   <h3 className="text-base font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                   <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">WhatsApp Group</span>
                 </div>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                 <div className="flex items-center text-sm text-gray-500">
                   <Users className="w-4 h-4 mr-1" />
                   {group.participants} participantes
                 </div>
               </div>
             </div>
           )) : (
              <div className="col-span-3 text-center p-10 text-gray-500">
                Nenhum grupo encontrado. Certifique-se de que o WhatsApp está conectado.
              </div>
           )}
        </div>
      )}

      {/* Modal: NEW CAMPAIGN */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Campanha</h2>
              <button onClick={() => setIsCampaignModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome</label>
                <input type="text" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Destinatários</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium mb-2 dark:text-gray-300">Listas Salvas</div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 dark:bg-slate-800">
                      {contactLists.length === 0 ? (
                        <div className="text-sm text-gray-500">Nenhuma lista salva.</div>
                      ) : (
                        contactLists.map(l => (
                          <label key={l.id} className="flex items-center gap-2 text-sm py-1">
                            <input type="checkbox" checked={selectedListIds.includes(l.id)} onChange={(e) => {
                              if (e.target.checked) setSelectedListIds(prev => [...prev, l.id]);
                              else setSelectedListIds(prev => prev.filter(x => x !== l.id));
                            }} />
                            <span className="truncate">{l.name} <span className="text-xs text-gray-400">({l.count})</span></span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 dark:text-gray-300">Grupos WhatsApp</div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 dark:bg-slate-800">
                      {whatsappGroups.length === 0 ? (
                        <div className="text-sm text-gray-500">Nenhum grupo disponível.</div>
                      ) : (
                        whatsappGroups.map(g => (
                          <label key={g.id} className="flex items-center gap-2 text-sm py-1">
                            <input type="checkbox" checked={selectedGroupIds.includes(g.id)} onChange={(e) => {
                              if (e.target.checked) setSelectedGroupIds(prev => [...prev, g.id]);
                              else setSelectedGroupIds(prev => prev.filter(x => x !== g.id));
                            }} />
                            <span className="truncate">{g.name} <span className="text-xs text-gray-400">({g.participants})</span></span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 dark:text-gray-300">Contatos WhatsApp</div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 dark:bg-slate-800">
                      {whatsappContacts.length === 0 ? (
                        <div className="text-sm text-gray-500">Nenhum contato WhatsApp disponível.</div>
                      ) : (
                        whatsappContacts.map(c => (
                          <label key={c.id} className="flex items-center gap-2 text-sm py-1">
                            <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={(e) => {
                              if (e.target.checked) setSelectedContacts(prev => [...prev, c.id]);
                              else setSelectedContacts(prev => prev.filter(x => x !== c.id));
                            }} />
                            <span className="truncate">{c.name || c.id} <span className="text-xs text-gray-400">{c.phone || ''}</span></span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Modelo (mensagem salva)</label>
                <div className="flex gap-2 mb-2">
                  <select value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(e.target.value || null)} className="flex-1 border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <option value="">-- Selecionar modelo (obrigatório)</option>
                    {templates.map(t => (
                      <option key={t._id || t.id} value={t._id || t.id}>{t.name || (t.content && t.content.substring(0, 40)) || 'Sem título'}</option>
                    ))}
                  </select>
                </div>

                {selectedTemplateId ? (
                  (() => {
                    const tpl = templates.find(t => t._id === selectedTemplateId || t.id === selectedTemplateId);
                    return tpl ? (
                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-slate-900 text-sm">
                        <div className="font-medium mb-1">{tpl.name}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tpl.content}</div>
                        {tpl.mediaUrl && <a href={tpl.mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 mt-2 inline-block">Ver mídia</a>}
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="text-sm text-red-500">Selecione um modelo para continuar.</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Agendamentos</label>
                <div className="flex gap-2 mb-2">
                   <input type="datetime-local" value={newCampaignDate} onChange={e => setNewCampaignDate(e.target.value)} className="flex-1 border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                   <button onClick={addSchedule} className="px-3 bg-gray-200 dark:bg-slate-600 rounded-lg"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                   {newCampaignSchedules.map(d => (
                     <div key={d} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                       {new Date(d).toLocaleString()}
                       <button onClick={() => removeSchedule(d)}><X className="w-3 h-3" /></button>
                     </div>
                   ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
              <button onClick={() => setIsCampaignModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">Cancelar</button>
              <button onClick={handleCreateCampaign} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2">
                 {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: NEW CONTACT LIST */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Lista de Contatos</h2>
              <button onClick={() => setIsContactModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Lista</label>
                 <input type="text" value={newListName} onChange={e => setNewListName(e.target.value)} className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Ex: Clientes Vips" />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Números (um por linha)</label>
                 <p className="text-xs text-gray-500 mb-2">Formato: DDD + Número ou DDD + Número, Nome</p>
                 <textarea 
                    rows={6} 
                    value={newContactNumbers} 
                    onChange={e => setNewContactNumbers(e.target.value)} 
                    className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm"
                    placeholder="11999999999, João&#10;21988888888, Maria"
                 ></textarea>
               </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
              <button onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">Cancelar</button>
              <button onClick={handleCreateList} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2">
                 {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Criar Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
