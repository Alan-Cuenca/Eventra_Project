import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { eventraService } from '../../services/eventraService';
import logoImg from '../../assets/logo.png';

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy EVARA, asistente virtual de EVENTRA. ¿Qué tipo de evento o salón estás buscando cotizar hoy?',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const data = await eventraService.enviarMensajeChatbot(userText);
      const botResponse = data?.respuesta || data?.data?.respuesta || 'Gracias por tu consulta. Puedes explorar los paquetes prediseñados en la sección de Servicios.';
      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Lo siento, ocurrió un problema momentáneo al contactar con el asistente. Por favor intenta nuevamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir el Chatbot con Logo Oficial */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.25rem',
          zIndex: 9998,
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#fff',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          boxShadow: '0 8px 24px var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        title="Asistente Virtual EVARA"
      >
        {isOpen ? (
          <X size={22} color="#fff" />
        ) : (
          <img
            src={logoImg}
            alt="EVARA"
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', padding: '2px' }}
          />
        )}
      </button>

      {/* Ventana flotante de Chat */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.2rem',
            left: '1.25rem',
            width: '380px',
            height: '500px',
            maxHeight: '80vh',
            background: 'rgba(18, 28, 35, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          className="animate-fade-in"
        >
          {/* Header del Chat */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'linear-gradient(90deg, rgba(69, 102, 119, 0.4), rgba(196, 181, 159, 0.2))',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src={logoImg}
                alt="EVARA"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FAF8F5', padding: '2px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>EVARA AI</div>
                <div style={{ fontSize: '0.68rem', color: '#5bc286', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5bc286' }} /> Asistente EVENTRA
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '12px',
                  background:
                    msg.sender === 'user'
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                      : 'rgba(23, 36, 46, 0.9)',
                  color: 'var(--text-primary)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  lineHeight: '1.4',
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '12px',
                  background: 'rgba(23, 36, 46, 0.9)',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                }}
              >
                EVARA está respondiendo...
              </div>
            )}
          </div>

          {/* Input de Mensaje */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.5rem',
              background: 'rgba(18, 28, 35, 0.95)',
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              placeholder="Escribe tu consulta sobre eventos..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.55rem 0.85rem' }}
              disabled={loading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
