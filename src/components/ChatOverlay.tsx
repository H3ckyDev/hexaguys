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
  isMobile?: boolean;
}

const QUICK_PHRASES = ["¡GG!", "¡Cuidado!", "¡Al centro!", "¡Bien jugado!"];

export function ChatOverlay({ messages, onSendMessage, localPlayerId, isMobile = false }: ChatOverlayProps) {
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
    <div className={`fixed z-40 flex flex-col items-start pointer-events-none font-sans antialiased ${isMobile ? "left-2 top-1/2 -translate-y-1/2" : "bottom-4 left-4 sm:bottom-6 sm:left-6"}`}>
      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div className="w-72 sm:w-80 md:w-96 rounded-3xl p-4 sm:p-5 mb-2.5 flex flex-col gap-3 bg-[#0f152b] border border-[#243464] shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto animate-in slide-in-from-bottom duration-150">
          {/* Cabecera */}
          <div className="flex justify-between items-center pb-2 border-b border-[#1b2548]">
            <div className="flex items-center gap-2">
              <ChatIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase font-black tracking-wider text-white">
                CANAL DE VOZ & CHAT
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-xl bg-[#141b36] hover:bg-white/10 text-slate-400 hover:text-white text-sm flex items-center justify-center cursor-pointer transition-colors"
              title="Cerrar"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div
            ref={messagesContainerRef}
            className="flex flex-col gap-2 max-h-56 sm:max-h-60 overflow-y-auto pr-1 text-sm custom-scrollbar scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm font-mono">
                No hay mensajes aún en la sala
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === localPlayerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-2xl transition-all ${
                      isMe
                        ? "bg-[#142347] border border-blue-500/40 self-end max-w-[92%]"
                        : "bg-[#0a0f22] border border-[#1f2a50] self-start max-w-[92%]"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <CyberAvatar
                        config={msg.senderAvatar || msg.senderSkin}
                        seed={msg.senderName}
                        color={msg.senderColor}
                        size={24}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className="font-bold tracking-tight truncate text-[11px]"
                          style={{ color: msg.senderColor || "#38bdf8" }}
                        >
                          {msg.senderName} {isMe && "(Tú)"}
                        </span>
                        <span className="text-slate-500 font-mono text-[9px] shrink-0">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <span className="text-slate-100 text-xs sm:text-sm break-words font-normal mt-0.5">
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
          <div className="flex items-center gap-1.5 pt-1 border-t border-[#1b2548] overflow-x-auto">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleQuickPhrase(phrase)}
                className="px-3 py-1.5 rounded-xl bg-[#0a0f22] hover:bg-[#162247] border border-[#1f2a50] hover:border-cyan-400 text-xs text-cyan-300 font-mono font-bold whitespace-nowrap cursor-pointer transition-all active:scale-95"
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
              className="flex-1 px-4 py-3 rounded-xl bg-[#0a0f22] border border-[#243058] focus:border-cyan-400 focus:outline-none text-white text-sm placeholder:text-slate-500 font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                inputText.trim()
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] active:scale-95"
                  : "bg-[#141b36] text-slate-600 cursor-not-allowed"
              }`}
              title="Enviar"
            >
              <SendIcon className="w-4 h-4" />
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
        className={`${isMobile ? "w-12 h-12 rounded-full" : "px-4.5 py-3 rounded-2xl"} bg-[#0f152b] hover:bg-[#141b36] border border-[#243464] hover:border-cyan-400 flex items-center justify-center gap-2.5 pointer-events-auto shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-all cursor-pointer active:scale-95`}
        title="Abrir chat"
      >
        <ChatIcon className={`${isMobile ? "w-6 h-6" : "w-4.5 h-4.5"} text-cyan-400`} />
        {!isMobile && <span className="text-sm font-bold font-mono uppercase text-white">CHAT</span>}
        {unreadCount > 0 && !isOpen && (
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-mono font-bold shadow-[0_0_10px_rgba(37,99,235,0.6)]">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
