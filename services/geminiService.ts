import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// NOTE: In a real production app, calls should go through a backend to protect the API Key.
// For this demo frontend, we assume the key is available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateMessageContent = async (topic: string, tone: string): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("API Key not found. Returning mock response.");
      return "Olá! Esta é uma mensagem de exemplo pois a chave de API não foi configurada. Configure sua API_KEY para usar a IA.";
    }

    const prompt = `
      Você é um especialista em copywriting para marketing no WhatsApp.
      Crie uma mensagem curta, persuasiva e formatada para WhatsApp (use emojis, quebras de linha).
      
      Tópico: ${topic}
      Tom de voz: ${tone}
      
      A mensagem deve ter no máximo 300 caracteres. Não inclua explicações, apenas o texto da mensagem.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Erro ao gerar conteúdo. Por favor, tente novamente.";
  }
};
