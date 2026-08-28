import { useState, useRef, useEffect } from "react";
import { playStepSound } from "../utils/sounds";
import { ChatIcon, SendIcon, CloseIcon } from "./Icons";
import { CyberAvatar } from "./CyberAvatar";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderSkin?: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  localPlayerId?: string;
}

const QUICK_PHRASES = ["GG", "¡CUIDADO!", "EZ"];

export function ChatOverlay({ messages, onSendMessage, localPlayerId }: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(messages.length);

  // Auto-scroll hacia el último mensaje
  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight + 500,
        behavior: instant ? "auto" : "smooth",
      });
    }
  };

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      if (!isOpen) {
        setUnreadCount((prev) => prev + (messages.length - lastCountRef.current));
      } else {
        requestAnimationFrame(() => scrollToBottom(false));
      }
      lastCountRef.current = messages.length;
    }
  }, [messages, isOpen]);

  // Reset y scroll al abrir
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      requestAnimationFrame(() => {
        scrollToBottom(true);
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Atajo Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        const isOtherInput =
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement;

        if (!isOtherInput) {
          e.preventDefault();
          setIsOpen(true);
          requestAnimationFrame(() => {
            scrollToBottom(true);
            inputRef.current?.focus();
          });
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

    requestAnimationFrame(() => {
      scrollToBottom(false);
      inputRef.current?.focus();
    });
  };

  const handleQuickPhrase = (phrase: string) => {
    onSendMessage(phrase);
    playStepSound();
    requestAnimationFrame(() => {
      scrollToBottom(false);
      inputRef.current?.focus();
    });
  };

  const formatTime = (time: number) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start pointer-events-none font-sans antialiased select-none">
      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div className="stealth-panel w-72 sm:w-84 md:w-96 mb-2.5 pointer-events-auto p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-150">
          {/* Cabecera */}
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ChatIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono uppercase font-black tracking-wider text-white">
                CANAL DE COMUNICACIÓN
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
              title="Cerrar"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div
            ref={messagesContainerRef}
            className="flex flex-col gap-1.5 max-h-56 sm:max-h-60 overflow-y-auto pr-1 text-sm scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No hay mensajes aún. ¡Escribe o usa una frase rápida!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === localPlayerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 p-2 transition-all ${
                      isMe
                        ? "bg-[#0b1428] border border-cyan-400/50 self-end max-w-[92%]"
                        : "bg-[#060912] border border-white/10 self-start max-w-[92%]"
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <CyberAvatar
                        config={msg.senderAvatar || msg.senderSkin}
                        seed={msg.senderName}
                        color={msg.senderColor}
                        size={20}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className="font-bold tracking-tight truncate text-[10px] font-mono"
                          style={{ color: msg.senderColor || "#38bdf8" }}
                        >
                          {msg.senderName} {isMe && "(Tú)"}
                        </span>
                        <span className="text-slate-500 font-mono text-[9px] shrink-0 tabular-nums">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <span className="text-slate-100 text-xs break-words font-normal mt-0.5 leading-relaxed font-mono">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Frases Rápidas Tácticas */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/10 overflow-x-auto py-0.5">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleQuickPhrase(phrase)}
                className="btn-esports-ghost px-2.5 py-1 text-[10px] text-cyan-300 font-mono font-black whitespace-nowrap cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Campo de Entrada de Texto */}
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
              className="flex-1 px-3 py-2 bg-[#050811] border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs placeholder:text-slate-500 font-mono"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 text-xs font-bold flex items-center justify-center cursor-pointer ${
                inputText.trim()
                  ? "btn-esports-primary"
                  : "bg-[#090d18] text-slate-600 cursor-not-allowed border border-white/5"
              }`}
              title="Enviar"
            >
              <SendIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Botón Flotante de Chat */}
      <button
        onClick={() => {
          playStepSound();
          setIsOpen((prev) => !prev);
        }}
        className="btn-esports-ghost px-3.5 py-2 flex items-center gap-2 pointer-events-auto cursor-pointer"
        title="Abrir canal de chat"
      >
        <ChatIcon className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono font-black uppercase text-white tracking-wider">CHAT</span>
        {unreadCount > 0 && !isOpen && (
          <span className="px-1.5 py-0.2 bg-cyan-500 text-black text-[9px] font-mono font-black tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
