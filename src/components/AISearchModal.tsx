/**
 * AI Search Modal Component
 * Modern conversational AI chatbot interface for intelligent destination search
 */

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Loader2, MapPin, Star, Mic, Plus, ExternalLink, Check } from 'lucide-react';
import { useAISearchMutation, type AISearchFilters } from '../hooks/useAISearch';
import { useSaveExternalDestination } from '../hooks/useSaveExternalDestination';
import { centeredToast } from './CenteredToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { Destination } from '../types/travel';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchComplete: (aiFilters: AISearchFilters, results: any[]) => void;
}

interface SearchFormData {
  textQuery: string;
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  results?: Destination[];
  filters?: AISearchFilters;
  searchMode?: 'internal' | 'trending';
}

const QUICK_SUGGESTIONS = [
  'Trending destinations on TikTok',
  'Viral travel spots',
  'Popular destinations',
  'Beach resorts',
  'Museums in Paris',
  'Nature spots',
];

export function AISearchModal({ isOpen, onClose, onSearchComplete }: AISearchModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: `Hi! I can help you find destinations in a couple of ways.

You can search through your saved destinations by describing what you're looking for - like "museums in Paris" or "beach resorts with good ratings."

Or, if you want to discover new places, I can show you what's trending on TikTok, Instagram, and other social media. Just ask me about trending destinations or what's popular right now.

What would you like to explore?`,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SearchFormData>();

  const textQuery = watch('textQuery');
  const aiSearchMutation = useAISearchMutation();
  const saveDestinationMutation = useSaveExternalDestination();
  const [savedDestinationIds, setSavedDestinationIds] = useState<Set<string | number>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Detect if query is a greeting or casual conversation
  const isGreetingOrCasual = (query: string): boolean => {
    const lowerQuery = query.toLowerCase().trim();
    const greetings = [
      'hello', 'hi', 'hey', 'hiya', 'howdy', 'greetings',
      'good morning', 'good afternoon', 'good evening',
      'what\'s up', 'whats up', 'sup', 'yo',
      'thanks', 'thank you', 'thx', 'ty',
      'bye', 'goodbye', 'see you', 'later',
      'how are you', 'how are you doing', 'how\'s it going',
      'what can you do', 'what do you do', 'help', 'help me'
    ];
    
    // Check for exact matches or queries that are just greetings
    if (greetings.some(greeting => lowerQuery === greeting || lowerQuery.startsWith(greeting + ' '))) {
      return true;
    }
    
    // Check if it's a very short casual message (1-2 words that aren't destination-related)
    const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 2 && !words.some(word => 
      ['find', 'search', 'show', 'get', 'trending', 'destination', 'place', 'travel', 'trip', 'vacation'].includes(word)
    )) {
      return true;
    }
    
    return false;
  };

  // Generate natural response to greetings/casual queries
  const getGreetingResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
      return "Hello! I'm here to help you find destinations. You can search your saved places or ask me about trending destinations on social media. What would you like to explore?";
    }
    
    if (lowerQuery.includes('how are you') || lowerQuery.includes('how\'s it going')) {
      return "I'm doing well, thanks for asking! I'm ready to help you find some great destinations. What are you looking for today?";
    }
    
    if (lowerQuery.includes('thanks') || lowerQuery.includes('thank you')) {
      return "You're welcome! Feel free to ask if you need help finding destinations or discovering trending places.";
    }
    
    if (lowerQuery.includes('bye') || lowerQuery.includes('goodbye')) {
      return "Goodbye! Happy travels!";
    }
    
    if (lowerQuery.includes('what can you do') || lowerQuery.includes('help') || lowerQuery.includes('what do you do')) {
      return "I can help you in two ways:\n\n1. Search through your saved destinations - just describe what you're looking for, like \"museums in Paris\" or \"beach resorts with good ratings.\"\n\n2. Discover trending destinations from social media - ask me about what's popular on TikTok or Instagram right now.\n\nWhat would you like to try?";
    }
    
    // Default casual response
    return "Hi! I'm here to help you find destinations. You can search your saved places or ask about trending destinations. What would you like to explore?";
  };

  const handleSearch = async (data?: SearchFormData, queryOverride?: string) => {
    // Get query from override, form data, or empty string
    const query = queryOverride || data?.textQuery || '';
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      console.warn('Empty query provided to handleSearch');
      return;
    }

    // If offline, show friendly message
    if (!isOnline) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: trimmedQuery,
        timestamp: new Date(),
      };
      
      const offlineMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: `Looks like I can't connect right now, but I can still suggest popular categories! Try:\n\n• Beaches\n• Food spots\n• Nature escapes\n• City highlights\n\nI'll reconnect once you're online.`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, userMessage, offlineMessage]);
      reset();
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedQuery,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Check if it's a greeting or casual conversation
    if (isGreetingOrCasual(trimmedQuery)) {
      console.log('💬 [AISearchModal] Detected greeting/casual query, responding naturally');
      setIsTyping(true);
      reset();
      
      // Simulate thinking time for natural feel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const greetingResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getGreetingResponse(trimmedQuery),
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, greetingResponse]);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    reset();

    try {
      // Log request details
      const requestPayload = { textQuery: trimmedQuery };
      console.log('🔍 [AISearchModal] Sending AI search request:', {
        payload: requestPayload,
        timestamp: new Date().toISOString(),
      });

      const response = await aiSearchMutation.mutateAsync({
        textQuery: trimmedQuery,
      });

      // Log raw response
      console.log('📥 [AISearchModal] Raw response received:', {
        searchMode: response.searchMode,
        resultsCount: response.results?.length || 0,
        results: response.results,
        aiFilters: response.aiFilters,
        fullResponse: response,
      });

      // Generate natural, conversational AI response (ChatGPT-style)
      const isTrending = response.searchMode === 'trending';
      let aiContent = '';

      if (isTrending) {
        if (response.results.length > 0) {
          const destinationNames = response.results.slice(0, 4).map(d => d.name);
          const moreCount = Math.max(0, response.results.length - 4);
          const platforms = [...new Set(response.results.map((d: any) => d.externalSourcePlatform).filter(Boolean))];
          const platformText = platforms.length > 0 ? platforms.join(' & ') : 'social media';
          
          // Exciting, detailed responses!
          if (response.results.length === 1) {
            aiContent = `🌟 **Amazing find!**\n\n**${destinationNames[0]}** is absolutely trending right now on ${platformText}! This destination is getting incredible attention from travelers worldwide.\n\nCheck out the details below - I've included why it's viral, insider tips, and the best hashtags to follow. Save it to your collection if you're interested!`;
          } else if (response.results.length <= 4) {
            const namesList = destinationNames.slice(0, -1).join(', ') + ' and ' + destinationNames.slice(-1);
            aiContent = `🔥 **Found ${response.results.length} incredible trending destinations!**\n\n${namesList}\n\nThese places are absolutely blowing up on ${platformText} right now! Each one features stunning photo spots, unique experiences, and insider tips that travelers are raving about.\n\nScroll through and save your favorites to your collection! ✨`;
          } else {
            aiContent = `🚀 **Wow! ${response.results.length} amazing destinations trending right now!**\n\nHighlights: ${destinationNames.join(', ')}${moreCount > 0 ? ` and ${moreCount} more incredible spots!` : ''}\n\nThese destinations are viral on ${platformText} - from stunning drone shots to hidden gems that influencers can't stop posting about!\n\nI've included detailed descriptions, best times to visit, and trending hashtags for each. Browse through and save the ones that speak to your wanderlust! 🌴✈️`;
          }
        } else {
          // Friendly, helpful no-results response
          aiContent = `I couldn't find specific trending destinations for "${trimmedQuery}" at the moment.\n\n💡 **Try these popular searches:**\n• "Trending beach destinations"\n• "Viral TikTok travel spots"\n• "Popular destinations in Asia"\n• "Instagram-worthy hidden gems"\n\nOr tell me what kind of vibe you're looking for and I'll find the perfect trending spots for you! 🌍`;
        }
        } else {
          // Internal search mode - detailed and helpful responses
          if (response.results.length > 0) {
            const filters = response.aiFilters;
            const destinationNames = response.results.slice(0, 4).map(d => d.name);
            const moreCount = Math.max(0, response.results.length - 4);
            const avgRating = response.results.length > 0
              ? (response.results.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / response.results.length).toFixed(1)
              : '0.0';

            // Build detailed filter description
            let contextNote = '';
            if (filters) {
              const notes = [];
              if (filters.category) notes.push(`${filters.category.toLowerCase()}s`);
              if (filters.locationContains) notes.push(`in ${filters.locationContains}`);
              if (filters.minRating !== undefined) notes.push(`rated ${filters.minRating}+ stars`);
              if (notes.length > 0) {
                contextNote = `Based on your search for ${notes.join(' ')}, `;
              }
            }

            // Detailed response based on result count
            if (response.results.length === 1) {
              aiContent = `📍 ${contextNote}I found a perfect match!\n\n**${destinationNames[0]}** with a ${avgRating}⭐ rating. This looks like exactly what you're looking for - check out the details below!`;
            } else if (response.results.length <= 4) {
              const namesList = destinationNames.slice(0, -1).join(', ') + ' and ' + destinationNames.slice(-1);
              aiContent = `📍 ${contextNote}I found ${response.results.length} great destinations!\n\n${namesList}\n\nAverage rating: ${avgRating}⭐\n\nBrowse through them below to find your perfect match!`;
            } else {
              aiContent = `📍 ${contextNote}I found ${response.results.length} destinations that match!\n\nHighlights: ${destinationNames.join(', ')}${moreCount > 0 ? ` and ${moreCount} more` : ''}\n\nAverage rating: ${avgRating}⭐\n\nWant me to narrow these down? Just tell me more about what you're looking for - maybe a specific location, type of experience, or rating range.`;
            }
          } else {
            // Helpful no-results response with suggestions
            aiContent = `Hmm, I couldn't find any saved destinations matching "${trimmedQuery}".\n\n💡 **Try these tips:**\n• Be more specific (e.g., "beaches in Bali" instead of just "beaches")\n• Check the category (museums, resorts, restaurants, nature)\n• Try a location name\n\n✨ **Or discover something new!**\nAsk me about trending destinations on TikTok - I can help you find amazing new places to add to your collection!`;
          }
        }

      // Ensure results is always an array
      const results = Array.isArray(response.results) ? response.results : [];
      
      console.log('✅ [AISearchModal] Processing response:', {
        resultsLength: results.length,
        searchMode: response.searchMode,
        willShowResults: results.length > 0,
        willShowNoResultsMessage: results.length === 0,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        results: results,
        filters: response.aiFilters,
        searchMode: response.searchMode,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Notify parent component (only for internal searches)
      if (response.searchMode === 'internal') {
        onSearchComplete(response.aiFilters || null, results);
      }

      // Show toast for both success and no results cases
      if (results.length > 0) {
        centeredToast.success(isTrending ? 'Trending destinations found!' : 'Search completed!', {
          description: `Found ${results.length} destination${results.length !== 1 ? 's' : ''}`,
        });
      } else {
        // Show info toast for no results (not an error, just no matches)
        centeredToast.info('No destinations found', {
          description: isTrending 
            ? 'Try asking about trending destinations in a specific region'
            : 'Try adjusting your search criteria or explore trending destinations',
        });
      }
    } catch (error: any) {
      // Log detailed error information
      console.error('❌ [AISearchModal] AI search error:', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        query: trimmedQuery,
        timestamp: new Date().toISOString(),
      });
      
      // Friendly, non-technical error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'm having a little trouble with that search right now. Let me help you another way!\n\n💡 **Quick suggestions:**\n• Try "trending destinations on TikTok"\n• Or "popular beach resorts"\n• Or "viral travel spots in Europe"\n\nI'm here to help you discover amazing places - just try a slightly different search and I'll find something great for you! 🌍`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      
      centeredToast.error('Search failed', {
        description: error?.message || 'Failed to process your search query',
      });
    } finally {
      setIsTyping(false);
      console.log('🏁 [AISearchModal] Search operation completed, isTyping set to false');
    }
  };

  const handleClose = () => {
    reset();
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: `Hi! I can help you find destinations in a couple of ways.

You can search through your saved destinations by describing what you're looking for - like "museums in Paris" or "beach resorts with good ratings."

Or, if you want to discover new places, I can show you what's trending on TikTok, Instagram, and other social media. Just ask me about trending destinations or what's popular right now.

What would you like to explore?`,
        timestamp: new Date(),
      },
    ]);
    onClose();
  };

  const handleQuickSuggestion = (suggestion: string) => {
    if (!suggestion || !suggestion.trim()) {
      console.warn('Empty suggestion provided');
      return;
    }
    // Remove emoji from suggestion for the actual query
    const trimmedSuggestion = suggestion.replace(/[🌟🔥✨🏖️🏛️🌲]/g, '').trim();
    setValue('textQuery', trimmedSuggestion);
    // Call handleSearch directly with the suggestion as override
    handleSearch(undefined, trimmedSuggestion);
  };

  // Prevent modal from closing on outside click or escape during search
  const handleOpenChange = (open: boolean) => {
    // Only close if explicitly set to false AND not currently searching
    if (!open && !isTyping && !aiSearchMutation.isPending) {
      console.log('🚪 [AISearchModal] Modal close requested (user action)');
      handleClose();
    } else if (!open && (isTyping || aiSearchMutation.isPending)) {
      console.log('⚠️ [AISearchModal] Prevented modal close during active search');
      // Prevent closing during search - do nothing
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      modal={true} // Ensure modal behavior
    >
      <DialogContent 
        className="p-0 bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl flex flex-col overflow-hidden will-change-transform"
        onEscapeKeyDown={(e) => {
          // Prevent closing on escape during search
          if (isTyping || aiSearchMutation.isPending) {
            console.log('⚠️ [AISearchModal] Prevented close on Escape during search');
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click during search
          if (isTyping || aiSearchMutation.isPending) {
            console.log('⚠️ [AISearchModal] Prevented close on outside click during search');
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent closing on any outside interaction during search
          if (isTyping || aiSearchMutation.isPending) {
            console.log('⚠️ [AISearchModal] Prevented close on outside interaction during search');
            e.preventDefault();
          }
        }}
      >
        {/* Header - Responsive */}
        <DialogHeader className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold text-white">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 text-purple-400" />
              </motion.div>
              AI Travel Assistant
              {/* Online/Offline Indicator */}
              {(showOnlineStatus || !isOnline) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isOnline ? "bg-green-500" : "bg-red-500 animate-pulse"
                    }`}
                  ></span>
                  <span className="text-[10px] font-normal opacity-90">
                    {isOnline ? "Connected" : "Offline"}
                  </span>
                </motion.div>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-[11px] sm:text-xs text-white/50 mt-1 text-center">
            Search destinations or discover trending places
          </DialogDescription>
        </DialogHeader>

        {/* Chat Body - Scrollable and Responsive */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 sm:py-4 space-y-3 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(168, 85, 247, 0.3) transparent',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-xl px-3 py-2.5 ${
                    message.type === 'user'
                      ? 'bg-purple-600/80 text-white rounded-br-sm'
                      : 'bg-purple-600/20 text-white rounded-bl-sm border border-purple-500/30'
                  }`}
                >
                  <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  
                  {/* Display Results */}
                  {message.results && message.results.length > 0 && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-white/10">
                      {message.results.map((destination) => {
                        const isExternal = destination.isExternal || message.searchMode === 'trending';
                        const isSaved = savedDestinationIds.has(destination.id);
                        const destinationId = typeof destination.id === 'string' ? destination.id : destination.externalSourceId || String(destination.id);
                        
                        return (
                          <div
                            key={destination.id}
                            className="bg-white/5 rounded-lg p-3 text-xs border border-white/10"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold text-white">{destination.name}</div>
                                  {isExternal && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                      Trending
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-white/70">
                                  <MapPin className="h-3 w-3" />
                                  <span>{destination.location}</span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                    <span>
                                      {(() => {
                                        const ratingNum = Number(destination.rating);
                                        return isNaN(ratingNum) || ratingNum === 0 
                                          ? '0.0' 
                                          : ratingNum.toFixed(1);
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                {destination.description && (
                                  <p className="text-white/60 mt-2 text-[11px] line-clamp-3 leading-relaxed">
                                    {destination.description}
                                  </p>
                                )}
                                {destination.hashtags && destination.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {destination.hashtags.slice(0, 4).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 bg-purple-500/20 text-purple-200 text-[9px] rounded-full border border-purple-400/30"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {isExternal && destination.externalSourceUrl && (
                                  <a
                                    href={destination.externalSourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 mt-2 text-purple-300 hover:text-purple-200 text-[10px]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View source</span>
                                  </a>
                                )}
                              </div>
                            </div>
                            {isExternal && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={async () => {
                                  if (isSaved) {
                                    centeredToast.info('Already saved', {
                                      description: 'This destination is already in your saved list',
                                    });
                                    return;
                                  }

                                  try {
                                    const result = await saveDestinationMutation.mutateAsync({
                                      name: destination.name,
                                      location: destination.location,
                                      category: destination.category,
                                      description: destination.description,
                                      image: destination.image,
                                      rating: destination.rating,
                                      externalSourceId: destination.externalSourceId || destinationId,
                                      externalSourcePlatform: destination.externalSourcePlatform || 'Trending',
                                      externalSourceUrl: destination.externalSourceUrl,
                                      hashtags: destination.hashtags,
                                    });

                                    setSavedDestinationIds((prev) => new Set(prev).add(destination.id));
                                    
                                    if (result.isDuplicate) {
                                      centeredToast.info('Already saved', {
                                        description: result.message,
                                      });
                                    } else {
                                      centeredToast.success('Destination saved!', {
                                        description: 'Added to your saved destinations',
                                      });
                                    }
                                  } catch (error: any) {
                                    console.error('Error saving destination:', error);
                                    centeredToast.error('Failed to save', {
                                      description: error.message || 'Could not save destination',
                                    });
                                  }
                                }}
                                disabled={saveDestinationMutation.isPending || isSaved}
                                className="w-full mt-3 bg-purple-600/80 hover:bg-purple-600 text-white text-xs h-7"
                              >
                                {saveDestinationMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Saving...
                                  </>
                                ) : isSaved ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to My Destinations
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Quick Suggestions - Show only when no user messages (except welcome) */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 mt-4"
            >
              <p className="text-xs text-white/60">You might want to try:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-purple-600/20 text-white rounded-2xl rounded-bl-sm px-4 py-3 border border-purple-500/30">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Footer - Responsive */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit((data) => {
              if (data.textQuery?.trim()) {
                handleSearch(data);
              }
            })();
          }}
          className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-white/10 flex-shrink-0 bg-slate-900/95"
        >
          <div className="relative flex items-center gap-2">
            <Input
              {...register('textQuery', {
                required: false,
                minLength: {
                  value: 1,
                  message: 'Please enter a search query',
                },
              })}
              placeholder="Ask anything..."
              className="flex-1 h-10 sm:h-11 rounded-full bg-secondary/50 border-white/10 text-white text-[15px] sm:text-sm placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20 pl-4 pr-12"
              disabled={aiSearchMutation.isPending || !isOnline}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  const currentValue = (e.currentTarget as HTMLInputElement).value?.trim();
                  console.log('⌨️ [AISearchModal] Enter key pressed, value:', currentValue);
                  if (currentValue && isOnline) {
                    handleSearch({ textQuery: currentValue });
                  }
                }
              }}
            />
            <div className="absolute right-2 flex items-center">
              <Button
                type="submit"
                size="icon"
                disabled={!textQuery?.trim() || aiSearchMutation.isPending || !isOnline}
                className="h-8 w-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                {aiSearchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {errors.textQuery && (
            <p className="text-xs text-red-400 mt-2 ml-2">{errors.textQuery.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
