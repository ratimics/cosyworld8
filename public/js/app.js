const { useState, useEffect } = React;

function TierBadge({ tier }) {
  const colors = {
    S: 'bg-purple-600',  // legendary
    A: 'bg-blue-600',    // rare
    B: 'bg-green-600',   // uncommon
    C: 'bg-yellow-600',  // common
    U: 'bg-gray-600'     // undefined
  };

  return (
    <span className={`${colors[tier]} px-2 py-1 rounded text-xs font-bold`}>
      Tier {tier}
    </span>
  );
}

function TierFilter({ selectedTier, onTierChange }) {
  const tiers = ['All', 'S', 'A', 'B', 'C', 'U'];
  const colors = {
    S: 'bg-purple-600',
    A: 'bg-blue-600',
    B: 'bg-green-600',
    C: 'bg-yellow-600',
    U: 'bg-gray-600'
  };

  return (
    <div className="flex gap-2 justify-center mb-6">
      {tiers.map(tier => (
        <button
          key={tier}
          className={`px-3 py-1 rounded ${
            selectedTier === tier 
              ? tier === 'All' 
                ? 'bg-white text-gray-900' 
                : `${colors[tier]} text-white`
              : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => onTierChange(tier)}
        >
          {tier}
        </button>
      ))}
    </div>
  );
}

function AvatarDetailModal({ avatar, onClose }) {
  const [reflections, setReflections] = useState([]);
  const [dungeonStats, setDungeonStats] = useState({ attack: 0, defense: 0, hp: 0 });
  const formatDate = (date) => new Date(date).toLocaleString();

  useEffect(() => {
    if (avatar) {
      fetch(`/api/avatar/${avatar._id}/reflections`)
        .then(res => res.json())
        .then(data => {
          setReflections(data.reflections);
          setDungeonStats(data.dungeonStats);
        });
    }
  }, [avatar]);

  if (!avatar) return null;

  function generateProgressBar(value, increment, emoji) {
    return emoji.repeat(Math.floor(value / increment));
  }

  const { attack, defense, hp } = dungeonStats;
  const attackBar = generateProgressBar(attack, 5, '⚔️');
  const defenseBar = generateProgressBar(defense, 5, '🛡️');
  const hpBar = generateProgressBar(hp, 33, '❣️'); // Assuming max HP is 1000

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <img 
              src={avatar.imageUrl} 
              alt={avatar.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h2 className="text-3xl font-bold">{avatar.name} {avatar.emoji}</h2>
              <p className="text-gray-400">Messages: {avatar.messageCount}</p>
              <p className="text-gray-500">Created: {formatDate(avatar.createdAt)}</p>
              {/* Display Dungeon Stats */}
              <div className="mt-2">
                <p className="text-gray-300">{attackBar}|{defenseBar}|{hpBar}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-2">Description</h3>
              <p className="text-gray-300">{avatar.description}</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-2">Personality</h3>
              <p className="text-gray-300">{avatar.dynamicPersonality}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-2">Recent Messages</h3>
              <div className="space-y-2">
                {(avatar.recentMessages || []).map((msg, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-gray-300">{msg.content}</p>
                    <p className="text-gray-500 text-xs">{formatDate(msg.timestamp)}</p>
                  </div>
                ))}
                {(!avatar.recentMessages || avatar.recentMessages.length === 0) && (
                  <p className="text-gray-500">No recent messages</p>
                )}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-2">Recent Reflections</h3>
              <div className="space-y-2">
                {reflections.map((reflection, i) => (
                  <div key={i} className="border-b border-gray-600 pb-2 mb-2 last:border-0">
                    <p className="text-gray-300">{reflection.reflectionContent}</p>
                    <p className="text-gray-500 text-xs">{formatDate(reflection.timestamp)}</p>
                  </div>
                ))}
                {reflections.length === 0 && (
                  <p className="text-gray-500">No reflections yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarCard({ avatar, onSelect }) {
  const renderLives = () => {
    if (avatar.status === 'dead') {
      return <span className="text-red-500">☠️ Dead</span>;
    }
    return Array(avatar.lives || 0).fill('❣️').join('');
  };

  return (
    <div 
      onClick={() => onSelect(avatar)}
      className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
        avatar.status === 'dead' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <img 
          src={avatar.imageUrl} 
          alt={avatar.name} 
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{avatar.name} {avatar.emoji}</h3>
            <TierBadge tier={avatar.tier} />
          </div>
          <p className="text-gray-400">Messages: {avatar.messageCount}</p>
          <p className="text-gray-400">{renderLives()}</p>
          <p className="text-sm text-gray-500">
            Active: {new Date(avatar.lastMessage).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function CombatLog() {
  const [combatLog, setCombatLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCombatLog = async () => {
      try {
        const response = await fetch('/api/dungeon/log');
        const data = await response.json();
        setCombatLog(data);
      } catch (error) {
        console.error('Error fetching combat log:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCombatLog();
    const interval = setInterval(fetchCombatLog, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {combatLog.map((entry, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg">{entry.result}</span>
            <span className="text-sm text-gray-400">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {entry.actor}
          </div>
        </div>
      ))}
      {combatLog.length === 0 && (
        <div className="text-center text-gray-500">No combat actions yet</div>
      )}
    </div>
  );
}

function ViewToggle({ currentView, onViewChange }) {
  return (
    <div className="flex justify-center gap-4 mb-8">
      <button
        className={`px-4 py-2 rounded ${
          currentView === 'leaderboard' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-300'
        }`}
        onClick={() => onViewChange('leaderboard')}
      >
        Leaderboard
      </button>
      <button
        className={`px-4 py-2 rounded ${
          currentView === 'combat' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-gray-300'
        }`}
        onClick={() => onViewChange('combat')}
      >
        Combat Log
      </button>
    </div>
  );
}

function App() {
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(null);
  const [lastId, setLastId] = useState(null);
  const [selectedTier, setSelectedTier] = useState('All');
  const [currentView, setCurrentView] = useState('leaderboard');
  
  const loadAvatars = async (isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    
    setLoading(true);
    try {
      const url = new URL('/api/leaderboard', window.location.origin);
      url.searchParams.set('limit', '24');
      
      if (selectedTier !== 'All') {
        url.searchParams.set('tier', selectedTier);
      }
      
      if (!isInitial && lastMessageCount !== null && lastId) {
        url.searchParams.set('lastMessageCount', lastMessageCount);
        url.searchParams.set('lastId', lastId);
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (isInitial) {
        setAvatars(data.avatars);
      } else {
        setAvatars(prev => [...prev, ...data.avatars]);
      }
      
      setHasMore(data.hasMore);
      setLastMessageCount(data.lastMessageCount);
      setLastId(data.lastId);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvatars(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        !loading &&
        hasMore
      ) {
        loadAvatars();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, lastMessageCount, lastId]);

  useEffect(() => {
    setLastMessageCount(null);
    setLastId(null);
    setHasMore(true);
    setAvatars([]);
    loadAvatars(true);
  }, [selectedTier]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Avatar Dashboard</h1>
      <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      
      {currentView === 'leaderboard' ? (
        <>
          <TierFilter 
            selectedTier={selectedTier} 
            onTierChange={tier => setSelectedTier(tier)} 
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {avatars.map(avatar => (
              <AvatarCard 
                key={avatar._id} 
                avatar={avatar} 
                onSelect={setSelectedAvatar}
              />
            ))}
          </div>
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          )}
          <AvatarDetailModal 
            avatar={selectedAvatar} 
            onClose={() => setSelectedAvatar(null)} 
          />
        </>
      ) : (
        <CombatLog />
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(<App />);