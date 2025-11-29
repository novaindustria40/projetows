
import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';

const Connection: React.FC = () => {
  const [status, setStatus] = useState<'disconnected' | 'scanning' | 'connected' | 'initializing'>('disconnected');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lostConnection, setLostConnection] = useState(false);

  const API_PREFIX = '/api';

  useEffect(() => {
    // Determine the WebSocket URL from the current window location
    const socketURL = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:80'; // Adjust port if your dev server runs elsewhere

    const socket = io(socketURL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Request initial status on connection
      fetch(`${API_PREFIX}/whatsapp/status`).then(res => res.json()).then(data => {
        setStatus(data.status);
        setQrCodeData(data.qrCode);
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      if (status === 'connected') {
        setLostConnection(true);
      }
      setStatus('disconnected');
    });

    socket.on('status', (data: { status: 'disconnected' | 'scanning' | 'connected' | 'initializing', qrCode: string | null }) => {
      console.log('Received status update:', data.status);
      if (status === 'connected' && data.status === 'disconnected') {
        setLostConnection(true);
      }
      setStatus(data.status);
      setQrCodeData(data.qrCode);

      if (data.status === 'connected' || data.status === 'scanning') {
        setErrorMsg(null);
      }
    });
    
    socket.on('qr', (qr: string) => {
      console.log('QR code received via WebSocket');
      setStatus('scanning');
      setQrCodeData(qr);
    });

    return () => {
      socket.disconnect();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('status');
      socket.off('qr');
    };
  }, [status]); // Re-run effect if status changes to handle lost connection correctly

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setLostConnection(false);
    setQrCodeData(null); // Clear old QR code
    setStatus('initializing'); // Set status to initializing immediately

    try {
      const res = await fetch(`${API_PREFIX}/whatsapp/connect`, { method: 'POST' });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = `Erro ${res.status}: ${res.statusText}`;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorJson = await res.json();
          errorMessage = errorJson.error || errorMessage;
        } else {
          const errorText = await res.text();
          errorMessage = errorText.includes('<!DOCTYPE html>') 
            ? `Endpoint não encontrado (${res.status}). Verifique o backend.`
            : errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      // No need to do anything else, WebSocket will handle the updates
    } catch (error: any) {
      console.error('Error starting connection', error);
      setErrorMsg(`Falha ao iniciar: ${error.message}`);
      setStatus('disconnected'); // Revert status on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_PREFIX}/whatsapp/logout`, { method: 'POST' });
      setStatus('disconnected');
      setQrCodeData(null);
      setLostConnection(false);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conexão WhatsApp</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie a sessão da sua instância do WhatsApp Web.</p>
      </div>


      {/* Alerta de perda de conexão */}
      {lostConnection && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg mb-6 flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-5 h-5" />
          <span>Conexão perdida com o WhatsApp. Clique para reconectar.</span>
          <button
            onClick={handleConnect}
            className="ml-4 px-4 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
          >Reconectar</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Instructions Side */}
        <div className="p-8 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Como conectar?</h2>
          <ol className="space-y-4 text-gray-600 dark:text-gray-300 list-decimal list-inside">
            <li className="pl-2">Abra o WhatsApp no seu celular.</li>
            <li className="pl-2">Toque em <strong>Menu</strong> (Android) ou <strong>Configurações</strong> (iPhone).</li>
            <li className="pl-2">Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>.</li>
            <li className="pl-2">Aponte seu celular para esta tela para capturar o código.</li>
          </ol>
          
          <div className="mt-8 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
            <span>Conexão criptografada ponta-a-ponta.</span>
          </div>
        </div>

        {/* Action Side */}
        <div className="p-8 md:w-1/2 bg-gray-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center min-h-[400px]">
          {status === 'disconnected' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Instância Desconectada</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">{lostConnection ? 'A sessão foi perdida. Clique em reconectar para gerar um novo QR Code.' : 'Inicie uma nova sessão para começar a enviar mensagens.'}</p>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {lostConnection ? 'Reconectar' : 'Gerar QR Code'}
              </button>
            </div>
          )}

          {(status === 'scanning' || status === 'initializing') && (
            <div className="space-y-6 relative w-full">
              <div className="relative w-[240px] h-[240px] bg-white p-4 rounded-lg shadow-sm mx-auto">
                {!qrCodeData ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  </div>
                ) : (
                  <QRCode value={qrCodeData} size={224} />
                )}
                {qrCodeData && <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_10px_#22c55e] animate-[scan_2s_ease-in-out_infinite]"></div>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white animate-pulse">
                  {status === 'initializing' ? 'Inicializando conexão com o WhatsApp...' : 'Aguardando leitura do QR Code pelo celular...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Mantenha a janela aberta até a conexão ser concluída.</p>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400">Conectado com Sucesso!</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Sua sessão está ativa e pronta para enviar campanhas e mensagens.</p>
              <button
                onClick={handleDisconnect}
                className="mt-4 px-6 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center mx-auto gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Connection;
