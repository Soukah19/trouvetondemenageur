import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle, Loader, Lock, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'mover';
  content: string;
  read: boolean;
  created_at: string;
};

type Conversation = {
  id: string;
  quote_request_id: string;
  client_id: string;
  mover_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type MessagingInterfaceProps = {
  quoteRequestId: string;
  moverId?: string;
  clientId?: string;
  userType: 'client' | 'mover';
  onClose?: () => void;
  compact?: boolean;
};

export function MessagingInterface({
  quoteRequestId,
  moverId,
  clientId,
  userType,
  onClose,
  compact = false
}: MessagingInterfaceProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [quoteRequestId]);

  // Set up realtime subscription AFTER conversation is loaded
  useEffect(() => {
    if (!conversation?.id) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const channel = supabase
      .channel(`chat-${conversation.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Only add if not already in the list (avoid duplicates from optimistic update)
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe((status, err) => {
        console.log(`Realtime subscription status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected for conversation', conversation.id);
          // Clear polling if realtime is working
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime failed, falling back to polling');
          // Start polling as fallback if realtime fails
          if (!pollInterval) {
            pollInterval = setInterval(async () => {
              try {
                const { data: latestMessages } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('conversation_id', conversation.id)
                  .order('created_at', { ascending: true });
                
                if (latestMessages) {
                  setMessages(prev => {
                    // Only update if we have new messages
                    if (latestMessages.length !== prev.length || 
                        (latestMessages.length > 0 && prev.length > 0 && 
                         latestMessages[latestMessages.length - 1].id !== prev[prev.length - 1]?.id)) {
                      return latestMessages;
                    }
                    return prev;
                  });
                }
              } catch (err) {
                console.error('Polling error:', err);
              }
            }, 3000);
          }
        }
      });

    channelRef.current = channel;

    // Also start a gentle poll every 5s as a safety net even if realtime works
    // (this catches edge cases where realtime misses messages)
    const safetyPoll = setInterval(async () => {
      if (!conversation?.id) return;
      try {
        const { data: latestMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        
        if (latestMessages) {
          setMessages(prev => {
            if (latestMessages.length > prev.length) {
              return latestMessages;
            }
            // Check if last message is different (handles temp ID replacements)
            if (latestMessages.length > 0 && prev.length > 0) {
              const lastReal = latestMessages[latestMessages.length - 1];
              const lastLocal = prev[prev.length - 1];
              if (lastReal.id !== lastLocal.id && !lastLocal.id.startsWith('temp-')) {
                return latestMessages;
              }
            }
            return prev;
          });
        }
      } catch {
        // Silent fail for safety poll
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(safetyPoll);
    };
  }, [conversation?.id]);

  const checkPaymentStatus = async () => {
    try {
      setCheckingPayment(true);

      const { data: paymentData } = await supabase
        .from('payments')
        .select('payment_status')
        .eq('quote_request_id', quoteRequestId)
        .maybeSingle();

      if (paymentData) {
        const completedStatuses = ['completed', 'deposit_released', 'released_to_mover', 'fully_paid'];
        if (completedStatuses.includes(paymentData.payment_status)) {
          setIsPaid(true);
          return;
        }
      }

      const { data: quoteRequestData } = await supabase
        .from('quote_requests')
        .select('payment_status')
        .eq('id', quoteRequestId)
        .maybeSingle();

      if (quoteRequestData) {
        const paidStatuses = ['deposit_paid', 'fully_paid', 'completed'];
        if (paidStatuses.includes(quoteRequestData.payment_status)) {
          setIsPaid(true);
          return;
        }
      }

      const { data: quoteData } = await supabase
        .from('quotes')
        .select('status')
        .eq('quote_request_id', quoteRequestId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (quoteData?.status === 'accepted') {
        const { data: acceptedPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('quote_request_id', quoteRequestId)
          .maybeSingle();
        if (acceptedPayment) {
          setIsPaid(true);
          return;
        }
      }

      setIsPaid(false);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setIsPaid(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      await checkPaymentStatus();

      let conversationData: Conversation | null = null;

      if (userType === 'client' && moverId) {
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('quote_request_id', quoteRequestId)
          .eq('mover_id', moverId)
          .maybeSingle();

        if (data) {
          conversationData = data;
        } else {
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              quote_request_id: quoteRequestId,
              client_id: user?.id,
              mover_id: moverId,
              status: 'active'
            })
            .select()
            .single();

          if (createError) {
            if (createError.code === '23505') {
              const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('quote_request_id', quoteRequestId)
                .eq('mover_id', moverId)
                .single();
              conversationData = existing;
            } else {
              throw createError;
            }
          } else {
            conversationData = newConv;
          }
        }
      } else if (userType === 'mover' && clientId) {
        const { data: moverData } = await supabase
          .from('movers')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (!moverData) throw new Error('Mover not found');

        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('quote_request_id', quoteRequestId)
          .eq('mover_id', moverData.id)
          .maybeSingle();

        if (data) {
          conversationData = data;
        } else {
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              quote_request_id: quoteRequestId,
              client_id: clientId,
              mover_id: moverData.id,
              status: 'active'
            })
            .select()
            .single();

          if (createError) {
            if (createError.code === '23505') {
              const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('quote_request_id', quoteRequestId)
                .eq('mover_id', moverData.id)
                .single();
              conversationData = existing;
            } else {
              throw createError;
            }
          } else {
            conversationData = newConv;
          }
        }
      }

      setConversation(conversationData);

      if (conversationData) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationData.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Mark received messages as read
        await supabase
          .from('messages')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationData.id)
          .neq('sender_id', user?.id);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update: add message locally immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user?.id || '',
      sender_type: userType,
      content: messageContent,
      read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user?.id,
        sender_type: userType,
        content: messageContent
      }).select().single();

      if (error) throw error;

      // Replace optimistic message with real one
      if (data) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-96' : 'h-[600px]'} bg-white rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-5 h-5 text-white" />
          <div>
            <h3 className="font-semibold text-white">Messagerie</h3>
            <p className="text-xs text-blue-100">
              Discussion avec le {userType === 'client' ? 'déménageur' : 'client'}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white hover:text-blue-100">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm mt-1">Commencez la conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 rounded-b-xl">
        {!isPaid && userType === 'client' ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Messagerie verrouillée</p>
              <p className="text-xs text-amber-700 mt-1">
                Vous devez effectuer le paiement pour déverrouiller la messagerie.
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
