import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Preloader from '../components/Preloader';

export default function StylistDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stylistName, setStylistName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (!token || role !== 'stylist') {
      navigate('/admin-login');
      return;
    }
    
    setStylistName(name || 'Stylist');
    fetchAppointments(token);
  }, [navigate]);

  const fetchAppointments = (token) => {
    fetch('/api/appointments/stylist', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.appointments) {
          setAppointments(data.appointments);
        } else {
          setError(data.message || 'Failed to load schedule.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Network error loading schedule.');
        setLoading(false);
      });
  };

  const handleUpdateStatus = (id, currentStatus, newStatus) => {
    const token = localStorage.getItem('authToken');
    
    fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === 'Appointment updated successfully') {
          fetchAppointments(token); // Refresh
        } else {
          alert(data.message || 'Failed to update status');
        }
      })
      .catch(() => alert('Network error.'));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'confirmed': return 'text-accentCyan border-accentCyan/30 bg-accentCyan/10';
      case 'in-progress': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'completed': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'cancelled': return 'text-rose-400 border-rose-400/30 bg-rose-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  return (
    <>
      <Preloader title="AURA / STYLIST" subtitle="CHAIR INTERFACE" />
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <p className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em] mb-4">Stylist Command Center</p>
            <h1 className="text-4xl md:text-5xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>
              Welcome, {stylistName}.
            </h1>
          </div>
          <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4" style={{ borderColor: 'var(--surface-border)' }}>
            <div className="w-3 h-3 rounded-full bg-accentCyan animate-pulse"></div>
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Station Active</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-sm mb-8 font-light">
            {error}
          </div>
        )}

        <div className="glass-panel p-8 rounded-3xl border" style={{ borderColor: 'var(--surface-border)' }}>
          <h2 className="text-xl font-display font-bold mb-6" style={{ color: 'var(--heading-color)' }}>Today's Queue</h2>
          
          {loading ? (
            <p className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>Syncing schedule...</p>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-mono text-accentCyan mb-2">Queue empty.</p>
              <p className="text-xs text-gray-500 font-light">Your chair is available for walk-ins.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {appointments.map(appt => (
                <div key={appt._id} className="rounded-2xl p-6 border transition-all duration-300 hover:border-accentCyan/40 bg-[var(--surface-bg)] flex flex-col md:flex-row justify-between gap-6" style={{ borderColor: 'var(--surface-border)' }}>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold font-display" style={{ color: 'var(--heading-color)' }}>{appt.appointment_time}</span>
                      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>{appt.appointment_date}</span>
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold font-display mb-1 text-accentCyan">{appt.user_name}</h3>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Service: {appt.service_name}</p>
                    </div>

                    {appt.notes && (
                      <div className="rounded-xl p-4 bg-black/20 border border-white/5 text-sm font-light italic" style={{ color: 'var(--text-muted)' }}>
                        "{appt.notes}"
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-3 justify-end items-end min-w-[200px]">
                    {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appt._id, appt.status, 'in-progress')}
                          className="w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition duration-300 cursor-none border border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        >
                          Start Session
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt._id, appt.status, 'completed')}
                          className="w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition duration-300 cursor-none border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Mark Completed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
