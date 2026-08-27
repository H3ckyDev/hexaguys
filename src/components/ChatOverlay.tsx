import { useState, useRef, useEffect } from "react";
import { playStepSound } from "../utils/sounds";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderSkin?: string;
  text: string;
  timestamp: number;
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  localPlayerId?: string;
}

const QUICK_EMOJIS = ["👋", "😂", "🚀", "💀", "🔥", "👑", "🎮", "🛡️"];

export function ChatOverlay({ messages, onSendMessage, localPlayerId }: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(messages.length);

  // Auto-scroll al último mensaje y gestión de contador de no leídos
  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      if (!isOpen) {
        setUnreadCount((prev) => prev + (messages.length - lastCountRef.current));
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      lastCountRef.current = messages.length;
    }
  }, [messages, isOpen]);

  // Al abrir el chat, reiniciar contador y enfocar input
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [isOpen]);

  // Atajo global: Presionar 'Enter' para abrir y enfocar el chat rápidamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario presiona Enter y no está escribiendo en otro input, abre el chat
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        const isOtherInput =
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement;

        if (!isOtherInput) {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setInputText("");
    playStepSound();

    // Mantener el foco en el input para seguir escribiendo
    setTimeout(() => {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 20);
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
    playStepSound();
    setTimeout(() => {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 20);
  };

  const formatTime = (time: number) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start pointer-events-none">
      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div className="ios-glass-panel w-80 md:w-96 rounded-[28px] p-4 mb-3 flex flex-col gap-3 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-200 border border-white/20">
          {/* Encabezado del Chat */}
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Chat de Partida
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                ({messages.length} msgs)
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs flex items-center justify-center cursor-pointer transition-colors"
              title="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Historial de Mensajes con Scroll */}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 text-xs custom-scrollbar">
            {messages.length === 0 ? (
              <div className="py-6 text-center text-white/40 text-[11px] italic">
                ¡Sé el primero en enviar un mensaje o reacción!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === localPlayerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-0.5 p-2 rounded-xl transition-all ${
                      isMe
                        ? "bg-sky-500/20 border border-sky-400/30 self-end max-w-[88%]"
                        : "bg-white/5 border border-white/10 self-start max-w-[88%]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span
                        className="font-bold tracking-tight truncate"
                        style={{ color: msg.senderColor || "#38bdf8" }}
                      >
                        {msg.senderName} {isMe && "(Tú)"}
                      </span>
                      <span className="text-white/30 font-mono text-[9px]">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <span className="text-white/90 text-xs break-words font-medium">
                      {msg.text}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Reacciones Rápidas de Emojis */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickEmoji(emoji)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all text-sm flex items-center justify-center cursor-pointer shadow-sm"
                title={`Enviar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Campo de Entrada de Texto con Aislamiento de Teclas */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  handleSend();
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              placeholder="Escribe un mensaje... (Enter)"
              maxLength={120}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-sky-400 focus:outline-none text-white text-xs placeholder:text-white/35 shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                inputText.trim()
                  ? "ios-btn-primary text-white shadow-md active:scale-95"
                  : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
              }`}
            >
              <span>➤</span>
            </button>
          </div>
        </div>
      )}

      {/* Botón Flotante para Abrir / Cerrar Chat */}
      <button
        onClick={() => {
          playStepSound();
          setIsOpen((prev) => !prev);
        }}
        className="ios-glass-panel px-3.5 py-2 rounded-full flex items-center gap-2 pointer-events-auto shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        title="Abrir chat (Atajo: Enter)"
      >
        <span className="text-base">💬</span>
        <span className="text-xs font-semibold text-white/90">Chat</span>
        {unreadCount > 0 && !isOpen && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
