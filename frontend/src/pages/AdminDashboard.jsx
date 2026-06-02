import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('services');

  // Services State
  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState('45');

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [filterDate, setFilterDate] = useState('');

  // Admin metrics
  const [metrics, setMetrics] = useState(null);

  // Feedbacks
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const activeToken = localStorage.getItem('authToken');
    const activeRole = localStorage.getItem('userRole');
    if (!activeToken || activeRole !== 'admin') {
      setErrorMessage('Admin access required. Redirecting...');
      setTimeout(() => {
        navigate('/admin-login');
      }, 1500);
      return;
    }
    setToken(activeToken);

    // Initial loads
    loadServices();
    loadAppointments();
    loadAdminMetrics(activeToken);

    // Reveal animations
    gsap.fromTo('.fade-in-up', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
    );

    // Magnetic buttons
    const magneticBtns = document.querySelectorAll('.magnetic');
    magneticBtns.forEach((btn) => {
      const onMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      };
      const onMouseLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1.1, 0.4)',
          overwrite: 'auto'
        });
      };
      btn.addEventListener('mousemove', onMouseMove);
      btn.addEventListener('mouseleave', onMouseLeave);
      btn._cleanup = () => {
        btn.removeEventListener('mousemove', onMouseMove);
        btn.removeEventListener('mouseleave', onMouseLeave);
      };
    });

    return () => {
      magneticBtns.forEach(btn => btn._cleanup && btn._cleanup());
    };
  }, [navigate]);

  const loadServices = () => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || []);
      })
      .catch((err) => setErrorMessage('Error downloading catalog: ' + err.message));
  };

  const loadAppointments = () => {
    fetch('/api/appointments-all')
      .then((res) => res.json())
      .then((data) => {
        setAppointments(data.appointments || []);
      })
      .catch((err) => setErrorMessage('Failed to download scheduled queue: ' + err.message));
  };

  const loadAdminMetrics = (authToken = token) => {
    const bearer = authToken || localStorage.getItem('authToken');
    if (!bearer) {
      setErrorMessage('Unable to load admin metrics: admin token missing');
      return;
    }

    fetch('/api/admin/metrics', {
      headers: {
        Authorization: `Bearer ${bearer}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Metrics fetch failed');
        return res.json();
      })
      .then((data) => {
        setMetrics(data);
      })
      .catch((err) => setErrorMessage('Unable to load admin metrics: ' + err.message));
  };

  const handleCreateServiceSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const serviceData = {
      name: serviceName,
      description: serviceDescription,
      duration_minutes: parseInt(serviceDuration, 10),
      price: parseFloat(servicePrice)
    };

    fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(serviceData)
    })
      .then((res) => res.json())
      .then(() => {
        setSuccessMessage('Catalog service deployed successfully.');
        setServiceName('');
        setServicePrice('');
        setServiceDescription('');
        setServiceDuration('45');
        loadServices();
      })
      .catch(() => setErrorMessage('Catalog deploy rejected.'));
  };

  const editService = (serviceId) => {
    setSuccessMessage('Modifier module pending deploy.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const deleteService = (serviceId) => {
    if (!window.confirm('Withdraw this service from catalog?')) return;
    setSuccessMessage('');
    setErrorMessage('');

    fetch(`/api/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then(() => {
        setSuccessMessage('Catalog service withdrawn.');
        loadServices();
      })
      .catch(() => setErrorMessage('Catalog withdrawal failed.'));
  };

  const confirmAppointment = (appointmentId) => {
    setSuccessMessage('');
    setErrorMessage('');

    fetch(`/api/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
      })
      .then(() => {
        setSuccessMessage('Occupant appointment confirmed.');
        loadAppointments();
      })
      .catch((err) => setErrorMessage(err.message || 'Confirmation failed.'));
  };

  const cancelAppointmentAdmin = (appointmentId) => {
    if (!window.confirm('Cancel this occupant session?')) return;
    setSuccessMessage('');
    setErrorMessage('');

    fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
      })
      .then(() => {
        setSuccessMessage('Occupant session cancelled.');
        loadAppointments();
      })
      .catch((err) => setErrorMessage(err.message || 'Cancellation failed.'));
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (!filterDate) return true;
    return appt.appointment_date === filterDate;
  });

  const pendingCount = appointments.filter((appt) => appt.status === 'pending').length;

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  return (
    <>
      <Preloader title="AURA / ADMIN" subtitle="COMMAND PORTAL" />

      <main className="min-h-screen px-8 md:px-24 py-28 max-w-7xl mx-auto w-full relative">
        <section className="w-full">
          <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
            
            {/* Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-8" style={{ borderBottom: '1px solid var(--surface-border-subtle)' }}>
              <div>
                <p className="text-accentCyan text-xs font-mono uppercase tracking-[0.24em] mb-3">Admin Command Center</p>
                <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight" style={{ color: 'var(--heading-color)' }}>Control Panel</h1>
                <p className="text-sm font-light mt-3 max-w-xl" style={{ color: 'var(--text-muted)' }}>
                  Curate styling catalog listings, manage appointment schedules, and track operations metrics in real-time.
                </p>
              </div>
              
              {/* Metrics Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="glass-panel rounded-2xl px-5 py-4 min-w-[120px] text-left" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Services</p>
                  <p className="text-3xl font-bold font-display mt-1" style={{ color: 'var(--heading-color)' }}>{metrics?.total_services ?? services.length}</p>
                </div>
                <div className="glass-panel rounded-2xl px-5 py-4 min-w-[120px] text-left" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Bookings</p>
                  <p className="text-3xl font-bold font-display mt-1" style={{ color: 'var(--heading-color)' }}>{metrics?.total_appointments ?? appointments.length}</p>
                </div>
                <div className="glass-panel rounded-2xl px-5 py-4 min-w-[120px] text-left" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Confirmed</p>
                  <p className="text-3xl font-bold font-display mt-1 text-emerald-300">{metrics?.confirmed_appointments ?? appointments.filter((appt) => appt.status === 'confirmed').length}</p>
                </div>
                <div className="glass-panel rounded-2xl px-5 py-4 min-w-[120px] text-left" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Revenue</p>
                  <p className="text-3xl font-bold font-display mt-1 text-accentCyan">${metrics?.total_revenue?.toFixed(2) ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('services')}
                className="rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition duration-300 magnetic cursor-none"
                style={{
                  backgroundColor: activeTab === 'services' ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
                  color: activeTab === 'services' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
                  borderWidth: activeTab === 'services' ? '0' : '1px',
                  borderColor: 'var(--tab-inactive-border)'
                }}
              >
                Services Catalog
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className="rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition duration-300 magnetic cursor-none"
                style={{
                  backgroundColor: activeTab === 'appointments' ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
                  color: activeTab === 'appointments' ? 'var(--tab-active-text)' : 'var(--tab-inactive-text)',
                  borderWidth: activeTab === 'appointments' ? '0' : '1px',
                  borderColor: 'var(--tab-inactive-border)'
                }}
              >
                Appointments Queue
              </button>
            </div>

            {/* Feedbacks */}
            {successMessage && (
              <div
                onClick={() => setSuccessMessage('')}
                className="mt-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 text-sm font-light cursor-none"
              >
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div
                onClick={() => setErrorMessage('')}
                className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-sm font-light cursor-none"
              >
                {errorMessage}
              </div>
            )}

            {/* Tab Content: Services Catalog */}
            {activeTab === 'services' && (
              <div className="mt-8">
                <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
                  
                  {/* Add Service Form */}
                  <div className="glass-panel rounded-2xl p-6" style={{ borderColor: 'var(--surface-border)' }}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full text-accentCyan flex items-center justify-center" style={{ backgroundColor: 'var(--icon-bg)' }}>
                        ➕
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-display" style={{ color: 'var(--heading-color)' }}>Create Service</p>
                        <p className="text-[11px] font-mono" style={{ color: 'var(--text-subtle)' }}>Insert a new styling offering</p>
                      </div>
                    </div>

                    <form onSubmit={handleCreateServiceSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="serviceName" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Service Title
                          </label>
                          <input
                            type="text"
                            id="serviceName"
                            required
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            placeholder="Signature Fade"
                            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label htmlFor="servicePrice" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Session Price ($)
                          </label>
                          <input
                            type="number"
                            id="servicePrice"
                            step="0.01"
                            required
                            value={servicePrice}
                            onChange={(e) => setServicePrice(e.target.value)}
                            placeholder="75.00"
                            className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="serviceDescription" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Description Outline
                        </label>
                        <textarea
                          id="serviceDescription"
                          rows="3"
                          value={serviceDescription}
                          onChange={(e) => setServiceDescription(e.target.value)}
                          placeholder="Sleek details and precision finish..."
                          className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label htmlFor="serviceDuration" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          id="serviceDuration"
                          required
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(e.target.value)}
                          className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                          style={inputStyle}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition duration-300 magnetic cursor-none"
                        style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                      >
                        Deploy Catalog Service
                      </button>
                    </form>
                  </div>

                  {/* Live Services List */}
                  <div className="glass-panel rounded-2xl p-6" style={{ borderColor: 'var(--surface-border)' }}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full text-accentCyan flex items-center justify-center" style={{ backgroundColor: 'var(--icon-bg)' }}>
                        📋
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-display" style={{ color: 'var(--heading-color)' }}>Live Catalog</p>
                        <p className="text-[11px] font-mono" style={{ color: 'var(--text-subtle)' }}>Current deployed offerings</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono border-collapse border-spacing-0">
                        <thead>
                          <tr className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-subtle)', borderBottom: '1px solid var(--surface-border-subtle)' }}>
                            <th className="pb-3 px-2 font-normal">Service</th>
                            <th className="pb-3 px-2 font-normal">Price</th>
                            <th className="pb-3 px-2 font-normal">Duration</th>
                            <th className="pb-3 px-2 font-normal text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((srv) => (
                            <tr key={srv._id} className="transition duration-200" style={{ borderBottom: '1px solid var(--surface-border-subtle)' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td className="px-2 py-3.5 font-semibold font-display" style={{ color: 'var(--heading-color)' }}>{srv.name}</td>
                              <td className="px-2 py-3.5 text-accentCyan">${srv.price}</td>
                              <td className="px-2 py-3.5" style={{ color: 'var(--text-muted)' }}>{srv.duration_minutes}m</td>
                              <td className="px-2 py-3.5 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => editService(srv._id)}
                                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-accentCyan hover:text-black transition cursor-none"
                                    style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--heading-color)' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteService(srv._id)}
                                    className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-none"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab Content: Appointments Queue */}
            {activeTab === 'appointments' && (
              <div className="mt-8">
                <div className="glass-panel rounded-2xl p-6" style={{ borderColor: 'var(--surface-border)' }}>
                  
                  {/* Queue Header and Date Filter */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 mb-6" style={{ borderBottom: '1px solid var(--surface-border-subtle)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full text-accentCyan flex items-center justify-center" style={{ backgroundColor: 'var(--icon-bg)' }}>
                        📅
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-display" style={{ color: 'var(--heading-color)' }}>Timeline Queue</p>
                        <p className="text-[11px] font-mono" style={{ color: 'var(--text-subtle)' }}>Validate or archive occupant sessions</p>
                      </div>
                    </div>

                    <div className="w-full md:w-64">
                      <label htmlFor="filterDate" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Query Timeline Date
                      </label>
                      <input
                        type="date"
                        id="filterDate"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-subtle)', borderBottom: '1px solid var(--surface-border-subtle)' }}>
                          <th className="pb-3 px-2 font-normal">Occupant</th>
                          <th className="pb-3 px-2 font-normal">Service</th>
                          <th className="pb-3 px-2 font-normal">Date</th>
                          <th className="pb-3 px-2 font-normal">Time Slot</th>
                          <th className="pb-3 px-2 font-normal">Status</th>
                          <th className="pb-3 px-2 font-normal">Directives</th>
                          <th className="pb-3 px-2 font-normal text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.length > 0 ? (
                          filteredAppointments.map((appt) => {
                            let statusBadgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
                            if (appt.status === 'confirmed') statusBadgeColor = 'bg-cyan-500/10 border-cyan-500/30 text-accentCyan';
                            if (appt.status === 'cancelled') statusBadgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-300';

                            return (
                              <tr key={appt._id} className="transition duration-200" style={{ borderBottom: '1px solid var(--surface-border-subtle)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <td className="px-2 py-3.5 font-semibold font-display" style={{ color: 'var(--heading-color)' }}>{appt.user_name || 'Occupant'}</td>
                                <td className="px-2 py-3.5" style={{ color: 'var(--text-muted)' }}>{appt.service_name || 'N/A'}</td>
                                <td className="px-2 py-3.5" style={{ color: 'var(--text-muted)' }}>{appt.appointment_date}</td>
                                <td className="px-2 py-3.5" style={{ color: 'var(--text-muted)' }}>{appt.appointment_time}</td>
                                <td className="px-2 py-3.5">
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadgeColor}`}>
                                    {appt.status}
                                  </span>
                                </td>
                                <td className="px-2 py-3.5 max-w-[120px] truncate" title={appt.notes || ''} style={{ color: 'var(--text-muted)' }}>
                                  {appt.notes || '-'}
                                </td>
                                <td className="px-2 py-3.5 text-right">
                                  <div className="flex gap-2 justify-end">
                                    {appt.status !== 'confirmed' && (
                                      <button
                                        onClick={() => confirmAppointment(appt._id)}
                                        className="rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accentCyan hover:bg-accentCyan hover:text-black transition cursor-none"
                                      >
                                        Confirm
                                      </button>
                                    )}
                                    {appt.status !== 'cancelled' && (
                                      <button
                                        onClick={() => cancelAppointmentAdmin(appt._id)}
                                        className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-none"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-2 py-6 text-center" style={{ color: 'var(--text-subtle)' }}>
                              No scheduled sessions found on this queue
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

          </div>
        </section>
      </main>
    </>
  );
}
