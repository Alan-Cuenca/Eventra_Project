import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  MessageSquare,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import logoImg from '../../assets/logo.png';

export const EvaraChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'evara',
      text: '¡Hola! Soy EVARA, asistente de ventas y planificación de eventos. ¿Qué tipo de evento o recepción deseas cotizar hoy?',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const texto = inputMessage.trim();
    if (!texto || loading) return;

    const userMessage = {
      sender: 'user',
      text: texto,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Petición a POST /api/chatbot con Axios
      const response = await api.post('/chatbot', { mensaje: texto });
      
      const respuestaTexto =
        response?.respuesta ||
        response?.data?.respuesta ||
        response?.data?.data?.respuesta ||
        'Con gusto te oriento. Te invito a consultar nuestros paquetes y servicios disponibles para más detalles.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'evara',
          text: respuestaTexto,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      console.error('[EvaraChatWidget] Error al consultar EVARA:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'evara',
          text: 'Lo siento, tuve un momento de congestión al consultar el catálogo. Por favor inténtalo de nuevo.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sugerencias = [
    '¿Qué paquetes para bodas tienen?',
    '¿Cuál es el costo del catering?',
    '¿Tienen opciones con barra libre?',
  ];

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#526F7D] hover:bg-[#3E5763] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none"
        title="Consultar con EVARA AI"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4D9A72] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4D9A72]"></span>
            </span>
          </div>
        )}
      </button>

      {/* Ventana de Chat Flotante ("Sofisticación Sutil") */}
      {isOpen && (
        <div className="fixed bottom-22 right-5 z-50 w-88 sm:w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[82vh] flex flex-col rounded-3xl bg-white border border-[#CBC6B6] shadow-2xl overflow-hidden animate-scale-up">
          
          {/* Cabecera Azul Grisáceo #526F7D */}
          <div className="bg-[#526F7D] text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">
                    EVARA AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#4D9A72] text-white">
                    En línea
                  </span>
                </div>
                <p className="text-[11px] text-white/80">
                  Asistente de Ventas y Catálogo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de Mensajes con Fondo Crema #F3F0E4 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F3F0E4]/70">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        <Bot size={13} />
                      </div>
                    )}

                    {/* Burbujas: Usuario en Beige #CEC8B8, EVARA en Blanco con borde */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#CEC8B8] text-[#233D49] rounded-tr-xs font-medium'
                          : 'bg-white text-[#233D49] border border-[#CBC6B6] rounded-tl-xs font-normal'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  <span className="text-[10px] text-[#7D8F97] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Indicador Escribiendo... */}
            {loading && (
              <div className="flex items-start gap-2 max-w-[85%] animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-[#526F7D]/15 text-[#526F7D] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white border border-[#CBC6B6] text-xs text-[#7D8F97] flex items-center gap-1.5 shadow-xs">
                  <span>EVARA está escribiendo</span>
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#526F7D] animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#526F7D] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#526F7D] animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-[#CBC6B6]/50 flex gap-1.5 overflow-x-auto text-[11px]">
              {sugerencias.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputMessage(sug)}
                  className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#F3F0E4] border border-[#CBC6B6] text-[#526F7D] whitespace-nowrap transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Formulario de Entrada con Input y Botón de Enviar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-[#CBC6B6] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Escribe tu consulta a EVARA..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#CBC6B6] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#526F7D] text-[#233D49] placeholder-[#7D8F97]"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-[#526F7D] hover:bg-[#3E5763] text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Enviar mensaje"
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default EvaraChatWidget;
