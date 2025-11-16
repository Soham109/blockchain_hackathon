"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, ArrowLeft, Package, User, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function ChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('id');
  const productId = searchParams?.get('productId');
  const receiverEmail = searchParams?.get('receiverEmail');
  const receiverId = searchParams?.get('receiverId');
  const productTitle = searchParams?.get('productTitle');
  const { toast } = useToast();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationUsers, setConversationUsers] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Check verification status
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user) {
      router.push('/auth/signin');
      return;
    }

    const user = session.user as any;
    if (!user.studentVerified) {
      router.push('/onboarding');
      return;
    }

    loadConversations();
  }, [session, status, router]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else if (productId && (receiverEmail || receiverId)) {
      createOrLoadConversation();
    }
  }, [conversationId, productId, receiverEmail, receiverId]);

  const isInitialLoadRef = useRef(true);
  const shouldScrollRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeConversation?._id) {
      const isNewConversation = conversationIdRef.current !== activeConversation._id;
      conversationIdRef.current = activeConversation._id;
      
      // Reset last message ID when conversation changes
      lastMessageIdRef.current = null;
      isInitialLoadRef.current = isNewConversation;
      shouldScrollRef.current = isNewConversation;
      
      loadMessages(activeConversation._id);
      loadOtherUser();
      // Poll every 4 seconds
      const interval = setInterval(() => {
        loadMessages(activeConversation._id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    // Only scroll if this is a new conversation or user is near bottom
    if (messagesEndRef.current && shouldScrollRef.current && messages.length > 0) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isInitialLoadRef.current || isNearBottom) {
          // Use setTimeout with longer delay to prevent scroll during conversation switch
          const timeoutId = setTimeout(() => {
            if (messagesEndRef.current && shouldScrollRef.current) {
              const container = messagesEndRef.current.parentElement;
              if (container) {
                const isStillNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
                if (isInitialLoadRef.current || isStillNearBottom) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
                  isInitialLoadRef.current = false;
                  shouldScrollRef.current = false;
                }
              }
            }
          }, 100);
          return () => clearTimeout(timeoutId);
        } else {
          shouldScrollRef.current = false;
        }
      }
    }
  }, [messages.length]); // Only trigger on message count change, not content

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function loadOtherUser() {
    if (!activeConversation) return;
    const otherEmail = getOtherParticipant(activeConversation);
    if (!otherEmail || otherEmail === 'Unknown') return;
    
    try {
      // Try to find user by email
      const res = await fetch(`/api/users?email=${encodeURIComponent(otherEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setOtherUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load other user', err);
    }
  }

  // Load current user profile for avatar
  useEffect(() => {
    async function loadCurrentUser() {
      if (!session?.user?.email) return;
      try {
        const res = await fetch(`/api/users?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load current user', err);
      }
    }
    if (session?.user) {
      loadCurrentUser();
    }
  }, [session?.user?.email]);

  async function loadConversations() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      const convs = data.conversations || [];
      setConversations(convs);
      
      // Load user data for all conversations
      const userMap = new Map<string, any>();
      const userEmail = (session?.user as any)?.email;
      
      await Promise.all(
        convs.map(async (conv: any) => {
          const otherEmail = conv.participantEmails?.find((e: string) => e !== userEmail);
          if (otherEmail && otherEmail !== 'Unknown') {
            try {
              const userRes = await fetch(`/api/users?email=${encodeURIComponent(otherEmail)}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.user) {
                  userMap.set(otherEmail, userData.user);
                }
              }
            } catch (err) {
              console.error('Failed to load user for conversation', err);
            }
          }
        })
      );
      
      setConversationUsers(userMap);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load conversations', err);
      setLoading(false);
    }
  }

  async function createOrLoadConversation() {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId,
          receiverEmail,
          productId,
          productTitle
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveConversation(data.conversation);
        router.replace(`/chat?id=${data.conversation._id}`);
      }
    } catch (err) {
      console.error('Failed to create conversation', err);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
        loadOtherUser();
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (res.ok) {
        const newMessages = data.messages || [];
        // Only update if we have new messages (prevent unnecessary re-renders)
        setMessages((prevMessages) => {
          // Create a map of existing messages
          const existingMap = new Map<string, any>();
          prevMessages.forEach((msg: any) => {
            if (msg._id) existingMap.set(String(msg._id), msg);
          });
          
          // Check if we actually have new messages
          let hasNew = false;
          newMessages.forEach((msg: any) => {
            const msgId = String(msg._id);
            if (!existingMap.has(msgId)) {
              hasNew = true;
              existingMap.set(msgId, msg);
            }
          });
          
          // Only update state if we have new messages
          if (!hasNew && prevMessages.length === existingMap.size) {
            return prevMessages; // Return same reference to prevent re-render
          }
          
          // Convert back to array and sort by createdAt
          const sorted = Array.from(existingMap.values()).sort((a: any, b: any) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
          // Update last message ID ref and set scroll flag for new messages
          if (sorted.length > 0) {
            const lastMsg = sorted[sorted.length - 1];
            const lastMsgId = String(lastMsg._id);
            if (lastMessageIdRef.current !== lastMsgId) {
              lastMessageIdRef.current = lastMsgId;
              // Only auto-scroll if this is a new message (not initial load)
              if (!isInitialLoadRef.current) {
                shouldScrollRef.current = true;
              }
            }
          }
          
          return sorted;
        });
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation?._id || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${activeConversation._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      if (res.ok) {
        // Don't add to state immediately - let the polling handle it
        // This prevents duplicates
        setNewMessage('');
        // Reload conversations to update last message
        loadConversations();
        // Reload messages after a short delay to get the new message
        shouldScrollRef.current = true;
        setTimeout(() => {
          loadMessages(activeConversation._id);
        }, 500);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  function getOtherParticipant(conv: any) {
    const userEmail = (session?.user as any)?.email;
    return conv.participantEmails.find((e: string) => e !== userEmail) || 'Unknown';
  }

  function getOtherParticipantId(conv: any) {
    const userId = String((session?.user as any)?.id);
    return conv.participantIds.find((id: string) => String(id) !== userId) || null;
  }

  // Always render same structure to avoid hook violations
  const user = session?.user as any;
  const isVerified = user?.studentVerified;
  const isLoading = status === 'loading' || !session?.user;
  const shouldShowContent = isVerified && status !== 'loading' && session?.user;

  // Always return the same structure
    return (
    <div className="h-screen pt-32 px-4 bg-background flex flex-col">
      {loading || isLoading ? (
        <div className="flex items-center justify-center flex-1">
        <div className="space-y-4 w-full max-w-7xl">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
      ) : !shouldShowContent ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Conversations List */}
          <Card className="w-80 flex-shrink-0 flex flex-col border-2 shadow-lg min-h-0">
            <CardHeader className="border-b pb-3 bg-muted flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <MessageCircle size={20} />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-2">Start a conversation from a product page</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherEmail = getOtherParticipant(conv);
                  const isActive = activeConversation?._id === conv._id;
                  const convUser = conversationUsers.get(otherEmail);
                  return (
                    <button
                      key={conv._id}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveConversation(conv);
                        router.replace(`/chat?id=${conv._id}`);
                      }}
                      className={`w-full p-4 text-left border-b hover:bg-accent/50 transition-all duration-200 cursor-pointer ${
                        isActive ? 'bg-accent border-l-4 border-l-primary shadow-sm' : 'hover:border-l-2 hover:border-l-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-primary/20">
                          <AvatarImage src={convUser?.avatar} alt={otherEmail} />
                          <AvatarFallback className="text-base font-bold">
                            {otherEmail[0]?.toUpperCase() || <User size={16} />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{otherEmail}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-auto flex-shrink-0">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conv.productTitle && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-1">
                              <Package size={12} />
                              {conv.productTitle}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="flex-1 flex flex-col border-2 shadow-lg min-h-0">
            {activeConversation ? (
              <>
                <CardHeader className="border-b pb-4 bg-muted flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-primary/30 shadow-sm">
                        <AvatarImage src={otherUser?.avatar} alt={getOtherParticipant(activeConversation)} />
                        <AvatarFallback className="text-xl font-bold">
                          {getOtherParticipant(activeConversation)[0]?.toUpperCase() || <User size={20} />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CardTitle className="text-lg font-bold truncate">{getOtherParticipant(activeConversation)}</CardTitle>
                          {otherUser?.studentVerified && (
                            <Badge variant="outline" className="text-xs border-green-500/30 text-green-700 dark:text-green-300">Verified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Mail size={12} />
                            <span className="truncate">{getOtherParticipant(activeConversation)}</span>
                          </div>
                          {otherUser?.role && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {otherUser.role}
                            </Badge>
                          )}
                        </div>
                        {activeConversation.productTitle && (
                          <Link 
                            href={`/products/${activeConversation.productId}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-2 cursor-pointer font-medium"
                          >
                            <Package size={14} />
                            <span className="truncate">{activeConversation.productTitle}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getOtherParticipantId(activeConversation) && (
                        <Link href={`/profile/${getOtherParticipantId(activeConversation)}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                            <User size={14} className="mr-2" />
                            Profile
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => router.push('/browse')} className="cursor-pointer hover:bg-accent">
                        <ArrowLeft size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth min-h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-base">No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.senderEmail === (session?.user as any)?.email;
                        return (
                          <div
                            key={msg._id}
                            className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} group`}
                          >
                            {!isOwn && (
                              <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20 shadow-sm">
                                <AvatarImage src={otherUser?.avatar} />
                                <AvatarFallback className="text-xs font-bold">
                                  {msg.senderEmail[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                              {!isOwn && (
                                <p className="text-xs text-muted-foreground mb-1.5 px-1.5 font-medium">
                                  {msg.senderEmail}
                                </p>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted border border-border/50'
                                }`}
                              >
                                {/* Extract and display images from content */}
                                {(() => {
                                  const imageUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg))/gi;
                                  const imageMatches = msg.content?.match(imageUrlRegex) || [];
                                  const imageUrl = msg.imageUrl || imageMatches[0];
                                  const textContent = msg.content?.replace(imageUrlRegex, '').trim() || '';
                                  
                                  return (
                                    <>
                                      {/* Display image if found */}
                                      {imageUrl && (
                                        <div className="mb-2 rounded-lg overflow-hidden max-w-full">
                                          <img 
                                            src={imageUrl} 
                                            alt="Message attachment" 
                                            className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(imageUrl, '_blank')}
                                            onError={(e) => {
                                              // Hide image on error
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}
                                      {/* Display text content if it exists and is not just an image URL */}
                                      {textContent && (
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{textContent}</p>
                                      )}
                                      {/* If message is only an image URL, show indicator */}
                                      {!textContent && imageUrl && (
                                        <span className="text-xs opacity-70">📷 Image</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 px-1.5 opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {isOwn && (
                              <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20 shadow-sm">
                                <AvatarImage src={currentUser?.avatar || (session?.user as any)?.image} />
                                <AvatarFallback className="text-xs font-bold">
                                  {(session?.user as any)?.email?.[0]?.toUpperCase() || <User size={12} />}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} className="h-1" />
                    </div>
                  )}
                </CardContent>

                <div className="p-4 border-t bg-muted flex-shrink-0">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 cursor-text border-2 focus:border-primary/50"
                      disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} className="cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                      <Send size={16} />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No conversation selected</p>
                  <p className="text-sm">Select a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-7xl">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
