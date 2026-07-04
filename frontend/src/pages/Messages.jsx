import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import Navbar from '../components/Navbar';
import { Send, MessageCircle, MapPin, ArrowLeft } from 'lucide-react';

const CONV_POLL_MS = 10000;
const MSG_POLL_MS = 4000;

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const activeId = id ? Number(id) : null;

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const convPollRef = useRef(null);
  const msgPollRef = useRef(null);

  const loadConversations = useCallback(() => {
    chatService.getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadConversations();
    convPollRef.current = setInterval(loadConversations, CONV_POLL_MS);
    return () => clearInterval(convPollRef.current);
  }, [user, navigate, loadConversations]);

  const loadMessages = useCallback((convId, showLoading) => {
    if (showLoading) setLoadingMsgs(true);
    chatService.getMessages(convId)
      .then((data) => {
        setMessages(data);
        // Mark the conversation as read locally so the badge clears instantly.
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
      })
      .catch(() => {})
      .finally(() => { if (showLoading) setLoadingMsgs(false); });
  }, []);

  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (!activeId) { setMessages([]); return; }
    loadMessages(activeId, true);
    msgPollRef.current = setInterval(() => loadMessages(activeId, false), MSG_POLL_MS);
    return () => clearInterval(msgPollRef.current);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await chatService.sendMessage(activeId, body);
      setMessages(prev => [...prev, msg]);
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.error || t('chat.sendFailed'));
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  const otherPartyName = (conv) => (user.id === conv.owner_id ? conv.tourist_name : conv.owner_name);
  const formatTime = (str) => str ? new Date(str).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={s.page}>
      <Navbar />
      <style>{`
        @media (max-width: 760px) {
          .messages-panel { height: calc(100vh - 60px) !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .messages-container { padding: 0 !important; max-width: 100% !important; }
          .messages-sidebar { display: ${activeId ? 'none' : 'flex'} !important; width: 100% !important; border-right: none !important; }
          .messages-thread { display: ${activeId ? 'flex' : 'none'} !important; width: 100% !important; }
          .messages-back-btn { display: inline-flex !important; }
        }
      `}</style>
      <div style={s.container} className="messages-container">
        <div style={s.panel} className="messages-panel">
          {/* Conversation list */}
          <div style={s.sidebar} className="messages-sidebar">
            <div style={s.sidebarHeader}>
              <h2 style={s.sidebarTitle}>{t('chat.title')}</h2>
            </div>
            {loadingConvs ? (
              <div style={s.loading}><div style={s.spinner} /></div>
            ) : conversations.length === 0 ? (
              <div style={s.empty}>
                <MessageCircle size={40} color="#ddd" strokeWidth={1} style={{ marginBottom: 10 }} />
                <p style={s.emptyText}>{t('chat.noConversations')}</p>
              </div>
            ) : (
              <div style={s.convList}>
                {conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/messages/${c.id}`)}
                    style={{ ...s.convItem, ...(c.id === activeId ? s.convItemActive : {}) }}
                  >
                    <div style={s.convRow}>
                      <span style={s.convName}>{otherPartyName(c)}</span>
                      {c.unread_count > 0 && c.id !== activeId && (
                        <span style={s.unreadBadge}>{c.unread_count}</span>
                      )}
                    </div>
                    <span style={s.convApt}><MapPin size={11} style={{ marginRight: 3 }} />{c.apartment_title}</span>
                    {c.last_message && (
                      <span style={s.convPreview}>{c.last_message}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thread */}
          <div style={s.thread} className="messages-thread">
            {!activeConv ? (
              <div style={s.noThread}>
                <MessageCircle size={48} color="#ddd" strokeWidth={1} />
                <p style={s.noThreadText}>{t('chat.selectConversation')}</p>
              </div>
            ) : (
              <>
                <div style={s.threadHeader}>
                  <button
                    className="messages-back-btn"
                    onClick={() => navigate('/messages')}
                    style={s.backBtn}
                    aria-label={t('chat.back')}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <div style={s.threadName}>{otherPartyName(activeConv)}</div>
                    <Link to={`/apartments/${activeConv.apartment_id}`} style={s.threadApt}>
                      {activeConv.apartment_title}
                    </Link>
                  </div>
                </div>

                <div style={s.messagesArea}>
                  {loadingMsgs ? (
                    <div style={s.loading}><div style={s.spinner} /></div>
                  ) : messages.length === 0 ? (
                    <p style={s.noMsgs}>{t('chat.noMessages')}</p>
                  ) : (
                    messages.map(m => {
                      const mine = m.sender_id === user.id;
                      return (
                        <div key={m.id} style={{ ...s.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{ ...s.bubble, ...(mine ? s.bubbleMine : s.bubbleTheirs) }}>
                            <span style={s.bubbleBody}>{m.body}</span>
                            <span style={{ ...s.bubbleTime, color: mine ? 'rgba(255,255,255,0.7)' : '#999' }}>
                              {formatTime(m.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} style={s.inputBar}>
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    style={s.input}
                  />
                  <button type="submit" disabled={!draft.trim() || sending} style={s.sendBtn}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  container: { maxWidth: 1040, margin: '0 auto', padding: '32px 24px 48px' },
  panel: {
    display: 'flex', height: 'calc(100vh - 140px)', minHeight: 480,
    backgroundColor: '#fff', borderRadius: 16, border: '1px solid #ebebeb',
    boxShadow: '0 2px 12px rgba(15,76,92,0.06)', overflow: 'hidden',
  },
  sidebar: { width: 300, flexShrink: 0, borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '18px 20px', borderBottom: '1px solid #ebebeb' },
  sidebarTitle: { fontSize: 18, fontWeight: 800, color: '#0F4C5C', margin: 0 },
  convList: { overflowY: 'auto', flex: 1 },
  convItem: {
    display: 'flex', flexDirection: 'column', gap: 3, width: '100%', textAlign: 'left',
    padding: '14px 20px', background: 'none', border: 'none', borderBottom: '1px solid #f2f2f2',
    cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif",
  },
  convItemActive: { backgroundColor: '#f0f7f9' },
  convRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  convName: { fontSize: 14, fontWeight: 700, color: '#0F4C5C' },
  unreadBadge: { backgroundColor: '#E8A87C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '1px 7px' },
  convApt: { fontSize: 12, color: '#999', display: 'flex', alignItems: 'center' },
  convPreview: { fontSize: 12.5, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  thread: { flex: 1, display: 'flex', flexDirection: 'column' },
  threadHeader: { padding: '16px 24px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: { display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0F4C5C', padding: 4, flexShrink: 0 },
  threadName: { fontSize: 15, fontWeight: 700, color: '#0F4C5C' },
  threadApt: { fontSize: 12.5, color: '#0F4C5C', textDecoration: 'none', borderBottom: '1px solid #E8A87C' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '65%', padding: '10px 14px', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 },
  bubbleMine: { backgroundColor: '#0F4C5C', color: '#fff', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#f0f0f0', color: '#222', borderBottomLeftRadius: 4 },
  bubbleBody: { fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' },
  bubbleTime: { fontSize: 10.5, alignSelf: 'flex-end' },
  noMsgs: { textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 },
  inputBar: { display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #ebebeb' },
  input: { flex: 1, padding: '11px 16px', border: '1px solid #ddd', borderRadius: 24, fontSize: 14, outline: 'none', fontFamily: "'Segoe UI', sans-serif" },
  sendBtn: { width: 42, height: 42, borderRadius: '50%', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  noThread: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 },
  noThreadText: { color: '#aaa', fontSize: 14 },
  loading: { display: 'flex', justifyContent: 'center', padding: 40 },
  spinner: { width: 28, height: 28, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { textAlign: 'center', padding: '40px 16px' },
  emptyText: { color: '#aaa', fontSize: 13, margin: 0 },
};
