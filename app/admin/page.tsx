'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [exemptIPs, setExemptIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentIP, setCurrentIP] = useState<string | null>(null);

  // Obtener la IP actual del usuario
  useEffect(() => {
    const fetchCurrentIP = async () => {
      try {
        const response = await fetch('/api/user-ip');
        const data = await response.json();
        setCurrentIP(data.ip);
      } catch (err) {
        console.error('Error fetching current IP:', err);
      }
    };
    
    fetchCurrentIP();
  }, []);

  // Obtener las IPs exentas
  const fetchExemptIPs = async () => {
    try {
      setError(null);
      const response = await fetch('/api/exempt-ips', {
        headers: {
          'x-admin-password': password
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch exempt IPs');
      }
      
      const data = await response.json();
      setExemptIPs(data.exemptIPs);
      setAuthenticated(true);
    } catch (err) {
      console.error('Error fetching exempt IPs:', err);
      setError('Failed to authenticate. Check your password.');
      setAuthenticated(false);
    }
  };

  // Añadir una IP exenta
  const addExemptIP = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!newIP) {
        setError('Please enter an IP address');
        return;
      }
      
      const response = await fetch('/api/exempt-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ ip: newIP })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add exempt IP');
      }
      
      const data = await response.json();
      setExemptIPs(data.exemptIPs);
      setSuccess(`Added ${newIP} to exempt IPs`);
      setNewIP('');
      
      // Forzar refresco después de 1 segundo
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Error adding exempt IP:', err);
      setError('Failed to add IP. Check your permissions.');
    }
  };

  // Eliminar una IP exenta
  const removeExemptIP = async (ip: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/exempt-ips', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ ip })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove exempt IP');
      }
      
      const data = await response.json();
      setExemptIPs(data.exemptIPs);
      setSuccess(`Removed ${ip} from exempt IPs`);
      
      // Forzar refresco después de 1 segundo
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Error removing exempt IP:', err);
      setError('Failed to remove IP. Check your permissions.');
    }
  };

  // Añadir la IP actual como exenta
  const addCurrentIP = () => {
    if (currentIP) {
      setNewIP(currentIP);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
        Admin Dashboard
      </h1>
      
      {!authenticated ? (
        <div className="p-6 bg-surface/30 backdrop-blur-sm rounded-xl border border-white/10 mb-8">
          <h2 className="text-xl font-medium text-white mb-4">Authentication</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex gap-4 mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="flex-1 px-4 py-2 rounded-lg bg-surface/50 border border-white/10 outline-none focus:border-primary/50"
            />
            <button
              onClick={fetchExemptIPs}
              className="px-6 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 bg-surface/30 backdrop-blur-sm rounded-xl border border-white/10 mb-8">
            <h2 className="text-xl font-medium text-white mb-4">Manage Exempt IPs</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-500 text-sm">{success}</p>
              </div>
            )}
            
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="IP Address"
                className="flex-1 px-4 py-2 rounded-lg bg-surface/50 border border-white/10 outline-none focus:border-primary/50"
              />
              <button
                onClick={addExemptIP}
                className="px-6 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors"
              >
                Add IP
              </button>
            </div>
            
            {currentIP && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm mb-2">Your current IP: {currentIP}</p>
                <button
                  onClick={addCurrentIP}
                  className="px-4 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors"
                >
                  Use My IP
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-medium text-white/80 mb-3">Exempt IPs</h3>
            
            {exemptIPs.length === 0 ? (
              <p className="text-content/60 italic">No exempt IPs found</p>
            ) : (
              <ul className="space-y-2">
                {exemptIPs.map((ip, index) => (
                  <li key={index} className="flex justify-between items-center px-4 py-2 bg-surface/40 rounded-lg">
                    <span className="text-content/80">{ip}</span>
                    <button
                      onClick={() => removeExemptIP(ip)}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setAuthenticated(false)}
              className="px-6 py-2 rounded-lg bg-surface/30 hover:bg-surface/40 text-content/80 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
} 