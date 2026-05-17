'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, Play, Pause, SkipForward, Music } from 'lucide-react';
import { useQueueStore, Song } from '../../../store/useQueueStore';

export default function RoomPage() {
  const params = useParams();
  const roomCode = params.code as string;
  const { connect, disconnect, queue, addSong, voteSong } = useQueueStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    connect(roomCode);
    return () => disconnect();
  }, [roomCode, connect, disconnect]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Using iTunes Search API for MVP
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=5`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = (track: any) => {
    const newSong: Omit<Song, 'score'> = {
      id: track.trackId.toString(),
      title: track.trackName,
      artist: track.artistName,
      albumArt: track.artworkUrl100,
    };
    addSong(newSong);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans max-w-4xl mx-auto flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Vibebox
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-zinc-400 text-sm">Room: <span className="font-mono font-bold text-white tracking-widest">{roomCode}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Crowd Vibe</p>
            <p className="text-green-400 font-bold">Excellent</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-6">
        
        {/* Search Bar */}
        <div className="relative z-10">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg"
              placeholder="Search for a song..."
            />
            <button 
              type="submit" 
              className="absolute inset-y-2 right-2 px-4 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
              >
                {searchResults.map((track) => (
                  <div 
                    key={track.trackId} 
                    onClick={() => handleAddSong(track)}
                    className="flex items-center gap-4 p-3 hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-0"
                  >
                    <img src={track.artworkUrl100} alt={track.trackName} className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold truncate">{track.trackName}</p>
                      <p className="text-sm text-zinc-400 truncate">{track.artistName}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Up Next <span className="text-sm bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{queue.length}</span>
          </h2>
          
          {queue.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
              <Music className="w-10 h-10 mb-2 opacity-50" />
              <p>The queue is empty. Add a song!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {queue.map((song, index) => (
                  <motion.layout
                    key={song.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`flex items-center gap-4 p-3 rounded-2xl border ${index === 0 ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/20 border-purple-500/30' : 'bg-zinc-900/50 border-zinc-800/50'}`}
                  >
                    {/* Rank / Playing state */}
                    <div className="w-6 text-center text-zinc-500 font-bold font-mono text-sm">
                      {index === 0 ? <Play className="w-4 h-4 text-purple-400 mx-auto animate-pulse" /> : index + 1}
                    </div>

                    <img src={song.albumArt} alt={song.title} className="w-14 h-14 rounded-xl shadow-md" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate text-white">{song.title}</p>
                      <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
                    </div>

                    {/* Voting Controls */}
                    <div className="flex flex-col items-center gap-1 bg-black/40 p-2 rounded-xl">
                      <button 
                        onClick={() => voteSong(song.id, 1)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-green-400 transition-colors"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <span className={`font-mono font-bold text-sm ${song.score > 0 ? 'text-green-400' : song.score < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {song.score > 0 ? '+' : ''}{song.score}
                      </span>
                      <button 
                        onClick={() => voteSong(song.id, -1)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.layout>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Host Controls MVP Footer */}
      <footer className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
            {queue[0] ? <img src={queue[0].albumArt} alt="playing" className="w-full h-full rounded-xl" /> : <Music className="w-5 h-5 text-zinc-500" />}
          </div>
          <div>
            <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-0.5">Now Playing</p>
            <p className="font-semibold text-sm max-w-[150px] sm:max-w-xs truncate">
              {queue[0] ? queue[0].title : 'Nothing playing'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
            <Pause className="w-5 h-5 fill-current" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  );
}
