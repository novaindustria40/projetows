
import React, { useState, useEffect } from 'react';
import { Image, Film, Type, Smartphone, Save, Link, Upload, Loader2, XCircle, Clock, Check, CheckCheck, AlertCircle, Search, User, Edit3, Trash2 } from 'lucide-react';

interface MessagesProps {
  categories: string[];
}

interface HistoryItem {
  id: string;
  recipient: string;
  content: string;
  type: 'text' | 'image' | 'video';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  date: string;
  mediaUrl?: string;
}

const Messages: React.FC<MessagesProps> = ({ categories }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  
  // Editor State
  const [messageType, setMessageType] = useState<'text' | 'image' | 'video'>('text');
  const [content, setContent] = useState('');
  const [mediaSource, setMediaSource] = useState<'url' | 'upload'>('url');
  const [mediaUrl, setMediaUrl] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [messageName, setMessageName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock History Data
  const [historyData] = useState<HistoryItem[]>([
    { id: '1', recipient: 'João Silva', content: 'Olá João! Aproveite nossa Black Friday com 50% OFF.', type: 'image', status: 'read', date: 'Hoje 10:30', mediaUrl: 'https://picsum.photos/300/200' },
    { id: '2', recipient: 'Maria Oliveira', content: 'Seu pedido #1234 saiu para entrega. Acompanhe no link.', type: 'text', status: 'delivered', date: 'Hoje 09:15' },
    { id: '3', recipient: 'Grupo Revenda SP', content: 'Nova tabela de preços disponível no portal.', type: 'text', status: 'read', date: 'Ontem 18:00' },
    { id: '4', recipient: 'Carlos Tech', content: 'Confirmação de agendamento para amanhã.', type: 'text', status: 'sent', date: 'Ontem 14:20' },
    { id: '5', recipient: 'Lead Frio #99', content: 'Ainda tem interesse na proposta?', type: 'text', status: 'failed', date: '23/10 11:00' },
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Falha ao enviar arquivo');
      const data = await res.json();
      setMediaUrl(data.url);
      setMediaSource('url');
    } catch (err) {
      console.error('Upload error', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  const clearMedia = () => {
    setMediaUrl('');
    setUploadProgress(0);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Function to handle clicking a history item to preview it
  const handleHistoryClick = (item: HistoryItem) => {
    setContent(item.content);
    setMessageType(item.type);
    setMediaUrl(item.mediaUrl || '');
    // In a real app, you might want to switch to editor view or just keep history view open 
    // but update the preview. For now, we just update the preview state.
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'sent': return <Check className="w-4 h-4 text-gray-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-300" />;
    }
  };

  // Templates management
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return setTemplates([]);
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleLoadTemplate = (tpl: any) => {
    setSelectedTemplateId(tpl._id || null);
    setMessageName(tpl.name || '');
    setContent(tpl.content || '');
    setMediaUrl(tpl.mediaUrl || '');
    setMessageType(tpl.mediaType || 'text');
    setActiveTab('editor');
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Left Column (Editor / History) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'editor' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-slate-900/30' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 border-r dark:border-r-slate-700'}`}
          >
            <Type className="w-4 h-4" />
            Novo Envio (Editor)
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-slate-900/30' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <Clock className="w-4 h-4" />
            Histórico de Mensagens
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
          {/* --- EDITOR TAB --- */}
          {activeTab === 'editor' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-gray-800 dark:text-white text-lg">Criar / Editar Mensagem</h2>
                <button
                  onClick={async () => {
                    try {
                      const payload = { name: messageName || 'Sem título', content, mediaUrl, mediaType: messageType };
                      const method = selectedTemplateId ? 'PUT' : 'POST';
                      const url = selectedTemplateId ? `/api/messages/${selectedTemplateId}` : '/api/messages';
                      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Falha ao salvar modelo');
                      }
                      await fetchTemplates();
                      setSelectedTemplateId(null);
                      setMessageName('');
                    } catch (err) {
                      console.error('Save template error', err);
                    }
                  }}
                  className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Modelo
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Mensagem</label>
                <input value={messageName} onChange={e => setMessageName(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-2.5 px-3" />
              </div>

              {/* Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Mídia</label>
                <div className="flex gap-2">
                  {[
                    { id: 'text', label: 'Texto', icon: Type },
                    { id: 'image', label: 'Imagem', icon: Image },
                    { id: 'video', label: 'Vídeo', icon: Film },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setMessageType(type.id as any);
                        if (type.id === 'text') setMediaUrl('');
                      }}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all
                        ${messageType === type.id 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500' 
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}
                      `}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-2.5 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Media Input Area */}
              {messageType !== 'text' && (
                <div className="mb-6 animate-fade-in p-4 bg-gray-50 dark:bg-slate-900/30 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Arquivo de Mídia</label>
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-600">
                      <button 
                        onClick={() => setMediaSource('url')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mediaSource === 'url' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500'}`}
                      >
                        Link URL
                      </button>
                      <button 
                        onClick={() => setMediaSource('upload')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mediaSource === 'upload' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500'}`}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  {mediaSource === 'url' ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="url"
                          placeholder={`https://exemplo.com/${messageType === 'image' ? 'imagem.jpg' : 'video.mp4'}`}
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {!mediaUrl && !isUploading ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Clique para fazer upload de {messageType === 'image' ? 'imagem' : 'vídeo'}</p>
                          </div>
                          <input type="file" className="hidden" accept={messageType === 'image' ? "image/*" : "video/*"} onChange={handleFileUpload} />
                        </label>
                      ) : (
                        <div className="relative bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center gap-3">
                          {isUploading ? (
                            <div className="w-full">
                               <div className="flex justify-between text-xs mb-1">
                                 <span>Enviando para o servidor...</span>
                                 <span>{uploadProgress}%</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-2">
                                 <div className="bg-primary-600 h-2 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                               </div>
                            </div>
                          ) : (
                            <>
                               <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                                  {messageType === 'image' ? (
                                    <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" />
                                  ) : (
                                    <Film className="text-gray-400" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate dark:text-gray-200">arquivo_upload_001.{messageType === 'image' ? 'jpg' : 'mp4'}</p>
                                 <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Upload concluído</p>
                               </div>
                               <button onClick={clearMedia} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors">
                                 <XCircle className="w-5 h-5" />
                               </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Content Area & AI Assistant */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo da Mensagem</label>
                  <span className="text-xs text-gray-400">{content.length} caracteres</span>
                </div>
                
                
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite sua mensagem aqui... Use *asteriscos* para negrito."
                  className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-3 px-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="p-0 h-full flex flex-col">
              {/* Search / Templates Header */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <div className="flex items-center justify-between">
                  <div className="relative w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar modelos..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                      onChange={() => { /* optional: implement client-side filter later */ }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{loadingTemplates ? 'Carregando...' : `${templates.length} modelos`}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {templates.length === 0 && !loadingTemplates ? (
                  <div className="p-6 text-center text-gray-500">Nenhum modelo salvo ainda.</div>
                ) : (
                  templates.map((tpl) => (
                    <div key={tpl._id || tpl.id} className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                        {tpl.mediaType === 'image' ? <Image className="w-5 h-5 text-gray-600" /> : tpl.mediaType === 'video' ? <Film className="w-5 h-5 text-gray-600" /> : <Type className="w-5 h-5 text-gray-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate pr-2">{tpl.name || 'Sem título'}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLoadTemplate(tpl)}
                              className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 rounded-md hover:brightness-95 flex items-center gap-2"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl._id)}
                              className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-md hover:brightness-95 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{tpl.content || <span className="italic">Sem conteúdo</span>}</p>
                        {tpl.mediaUrl && (
                          <a href={tpl.mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 mt-2 inline-block">Ver mídia</a>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <div className="h-10"></div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Preview (Always visible) */}
      <div className="w-full lg:w-[380px] flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700 sticky top-4 h-fit">
        <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
          <Smartphone className="w-5 h-5" />
          <span className="font-medium">
            {activeTab === 'editor' ? 'Pré-visualização ao Vivo' : 'Visualização do Histórico'}
          </span>
        </div>
        
        {/* Mockup Phone */}
        <div className="w-[300px] h-[580px] bg-white dark:bg-slate-950 border-[8px] border-gray-900 rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col">
          {/* Phone Header */}
          <div className="bg-[#075e54] h-16 flex items-center px-4 text-white shrink-0 z-20">
             <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
               <img src="https://picsum.photos/50/50" alt="Avatar" />
             </div>
             <div>
               <p className="text-sm font-semibold truncate w-32">
                 {activeTab === 'history' ? 'Histórico' : 'Cliente Exemplo'}
               </p>
               <p className="text-xs opacity-80">
                 {activeTab === 'history' ? 'Mensagem enviada' : 'online'}
               </p>
             </div>
          </div>

          {/* Chat Background */}
          <div className="flex-1 bg-[#e5ded8] dark:bg-[#0b141a] p-3 overflow-y-auto relative scrollbar-thin">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

            {/* Message Bubble */}
            <div className="relative max-w-[85%] ml-auto bg-[#d9fdd3] dark:bg-[#005c4b] p-2 rounded-lg rounded-tr-none shadow-sm mb-2 animate-fade-in">
              {/* Media Preview */}
              {messageType === 'image' && mediaUrl && (
                 <div className="mb-1 rounded overflow-hidden bg-gray-200 w-full h-32">
                   <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                 </div>
              )}
              {messageType === 'video' && mediaUrl && (
                 <div className="mb-1 rounded overflow-hidden bg-gray-200 w-full h-32 flex items-center justify-center relative">
                   <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">▶</div>
                   <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover -z-10" />
                 </div>
              )}

              {/* Text Content */}
              <p className="text-[13px] text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-sans">
                {content || <span className="italic text-gray-400">Sua mensagem aparecerá aqui...</span>}
              </p>
              
              {/* Timestamp */}
              <div className="flex justify-end items-end mt-1 gap-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-300">{getCurrentTime()}</span>
                <span className="text-blue-500 text-[10px]">✓✓</span>
              </div>
            </div>
          </div>

          {/* Phone Input Area (Mock) - Disable interaction if in history mode for visual cue */}
          <div className={`h-12 bg-[#f0f2f5] dark:bg-[#1f2c34] flex items-center px-2 gap-2 shrink-0 ${activeTab === 'history' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="w-6 h-6 rounded-full text-gray-400">☺</div>
            <div className="flex-1 h-8 bg-white dark:bg-[#2a3942] rounded-full px-3 text-xs flex items-center text-gray-400">
              Mensagem
            </div>
            <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs">mic</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
