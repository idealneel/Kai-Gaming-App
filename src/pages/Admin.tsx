import { useState, useEffect } from 'react';
import { Settings, LogOut, Send, Power, PowerOff, CheckCircle, XCircle, MessageCircle, Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import {
  updateStationStatus, subscribeToStations, getStations, getBookings, updateBookingStatus,
  TIME_SLOTS, toDateKey, type Station, type BookingRecord,
} from '../firebase/bookings';
import { getSettings, saveSettings, type SiteSettings } from '../firebase/settings';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured, requireFirestore } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

type Tab = 'calendar' | 'stations' | 'bookings' | 'discord' | 'settings';

export default function Admin() {
  const { user, isAdmin, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');
  const [stations, setStations] = useState<Station[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => {
    return toDateKey(new Date());
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    getStations().then(setStations);
    return subscribeToStations(setStations);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    getBookings().then(setBookings);
  }, [isAdmin, tab, refreshKey]);

  useEffect(() => {
    if (!isAdmin) return;
    getSettings().then(setSettings);
  }, [isAdmin]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStationToggle = async (stationId: string, status: 'open' | 'closed' | 'full') => {
    await updateStationStatus(stationId, status);
    showToast(`Station set to ${status.toUpperCase()}`);
  };

  const handleOpenAll = async () => {
    for (const s of stations) { await updateStationStatus(s.id, 'open'); }
    showToast('All stations opened');
  };

  const handleCloseAll = async () => {
    for (const s of stations) { await updateStationStatus(s.id, 'closed'); }
    showToast('All stations closed');
  };

  const handleConfirmBooking = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'confirmed');
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
    showToast('Booking confirmed');
  };

  const handleCancelBooking = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'cancelled');
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    showToast('Booking cancelled');
  };

  const handleChangeStation = async (bookingId: string, newStationId: string) => {
    await updateDoc(doc(requireFirestore(), 'bookings', bookingId), { stationId: newStationId });
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, stationId: newStationId } : b));
    showToast('Station updated');
  };

  const handleDeleteBooking = async (bookingId: string) => {
    await deleteDoc(doc(requireFirestore(), 'bookings', bookingId));
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    showToast('Booking deleted');
  };

  const handleTestWebhook = async () => {
    if (!DISCORD_WEBHOOK_URL) { showToast('Discord webhook URL not configured', 'error'); return; }
    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [{ title: 'Test Booking', color: 0x3498DB, description: 'This is a test booking from the admin panel.', timestamp: new Date().toISOString(), footer: { text: 'KaiGaming Admin Test' } }] }),
      });
      showToast(response.ok ? 'Test booking sent to Discord!' : 'Failed to send', response.ok ? 'success' : 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const sendDiscordConfirmation = async (booking: BookingRecord, action: 'confirm' | 'cancel') => {
    if (!DISCORD_WEBHOOK_URL) return;
    const stationName = stations.find((s) => s.id === booking.stationId)?.name ?? booking.stationId;
    const color = action === 'confirm' ? 0x2ECC71 : 0xE74C3C;
    const title = action === 'confirm' ? 'Booking Confirmed' : 'Booking Cancelled';
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [{ title, color, fields: [
        { name: 'Customer', value: booking.customerName, inline: true },
        { name: 'Station', value: stationName, inline: true },
        { name: 'Date', value: booking.date, inline: true },
        { name: 'Time', value: booking.timeSlot, inline: true },
      ], timestamp: new Date().toISOString(), footer: { text: 'KaiGaming Admin' } }] }),
    });
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
  };

  const updatePricing = <K extends keyof SiteSettings['pricing']>(key: K, value: string) => {
    if (!settings) return;
    const updated = { ...settings, pricing: { ...settings.pricing, [key]: value } };
    setSettings(updated);
    saveSettings(updated);
  };

  const clearAllBookings = async () => {
    const snap = await getDocs(collection(requireFirestore(), 'bookings'));
    for (const d of snap.docs) { await deleteDoc(doc(requireFirestore(), 'bookings', d.id)); }
    setBookings([]);
    showToast('All bookings cleared');
  };

  // Calendar helpers
  const calDate = new Date(calendarDate + 'T00:00:00');
  const calendarBookings = bookings.filter((b) => b.date === calendarDate);
  const prevDay = () => { const d = new Date(calendarDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setCalendarDate(toDateKey(d)); };
  const nextDay = () => { const d = new Date(calendarDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setCalendarDate(toDateKey(d)); };

  if (authLoading) return <div className="min-h-screen bg-kai-dark flex items-center justify-center"><div className="text-kai-muted">Loading...</div></div>;

  if (!isFirebaseConfigured) return (
    <div className="min-h-screen bg-kai-dark flex items-center justify-center">
      <div className="card-neo p-8 max-w-md w-full mx-4 text-center">
        <h1 className="text-2xl font-black mb-4">FIREBASE SETUP REQUIRED</h1>
        <p className="text-kai-muted">Add your Firebase web app settings to <code>.env</code> before using admin sign-in.</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-kai-dark flex items-center justify-center">
      <div className="card-neo p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-kai-red flex items-center justify-center border-3 border-kai-ink shadow-neo-lg mx-auto mb-6"><Settings size={32} className="text-kai-ink" /></div>
        <h1 className="text-2xl font-black mb-4">ADMIN ACCESS</h1>
        <p className="text-kai-muted mb-6">Sign in with your Google account.</p>
        <button onClick={loginWithGoogle} className="btn-neo bg-kai-surface text-kai-text w-full flex items-center justify-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-kai-dark flex items-center justify-center">
      <div className="card-neo p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-kai-red flex items-center justify-center border-3 border-kai-ink shadow-neo-lg mx-auto mb-6"><XCircle size={32} className="text-kai-ink" /></div>
        <h1 className="text-2xl font-black mb-4">ACCESS DENIED</h1>
        <p className="text-kai-muted mb-2">Signed in as <strong>{user.email}</strong></p>
        <p className="text-kai-muted text-sm mb-6">This account is not authorized.</p>
        <button onClick={logout} className="btn-neo bg-kai-surface text-kai-text">Sign Out</button>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
    { id: 'stations', label: 'Stations', icon: <Power size={16} /> },
    { id: 'bookings', label: 'Bookings', icon: <MessageCircle size={16} /> },
    { id: 'discord', label: 'Discord', icon: <Send size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-kai-dark">
      {toast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 px-4 py-3 border-3 border-kai-ink shadow-neo-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-kai-ink' : 'bg-kai-red text-kai-ink'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}

      <div className="bg-kai-deeper border-b-3 border-kai-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kai-red flex items-center justify-center border-3 border-kai-ink"><Settings size={20} className="text-kai-ink" /></div>
            <div><h1 className="font-black text-lg">ADMIN PANEL</h1><p className="text-kai-muted text-xs">{user.email}</p></div>
          </div>
          <button onClick={logout} className="btn-neo bg-kai-surface text-kai-text flex items-center gap-2 text-sm"><LogOut size={16} /> Sign Out</button>
        </div>
      </div>

      <div className="bg-kai-deeper border-b-3 border-kai-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-3 flex items-center gap-2 whitespace-nowrap transition-colors ${tab === t.id ? 'border-kai-red text-kai-red' : 'border-transparent text-kai-muted hover:text-kai-text'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Calendar Tab ─── */}
        {tab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={prevDay} className="btn-neo bg-kai-surface text-kai-text p-2"><ChevronLeft size={16} /></button>
                <h2 className="font-black text-base sm:text-lg text-center min-w-0">
                  {calDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
                <button onClick={nextDay} className="btn-neo bg-kai-surface text-kai-text p-2"><ChevronRight size={16} /></button>
              </div>
              <button onClick={() => { setRefreshKey((k) => k + 1); showToast('Refreshed'); }} className="btn-neo bg-kai-surface text-kai-text flex items-center gap-2 text-sm"><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Time slot grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-3 border-kai-ink">
                <thead>
                  <tr className="bg-kai-deeper">
                    <th className="border-3 border-kai-ink px-3 py-2 text-xs font-bold text-kai-red">Time</th>
                    {stations.map((s) => (
                      <th key={s.id} className="border-3 border-kai-ink px-3 py-2 text-xs font-bold">{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot}>
                      <td className="border-3 border-kai-ink px-3 py-2 text-xs font-bold text-kai-red bg-kai-deeper whitespace-nowrap">{slot}</td>
                      {stations.map((s) => {
                        const booking = calendarBookings.find((b) => b.stationId === s.id && b.timeSlot === slot && b.status !== 'cancelled');
                        return (
                          <td key={s.id} className="border-3 border-kai-ink px-2 py-2">
                            {booking ? (
                              <div className={`p-2 text-xs border-2 ${booking.status === 'confirmed' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'}`}>
                                <div className="font-bold">{booking.customerName}</div>
                                <div className="text-kai-muted">{booking.customerPhone}</div>
                                {booking.game && <div className="text-kai-red font-bold mt-1">{booking.game}</div>}
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {booking.status === 'pending' && (
                                    <button onClick={async () => { await handleConfirmBooking(booking.id); sendDiscordConfirmation(booking, 'confirm'); }} className="px-3 py-2 bg-green-500 text-kai-ink font-bold border border-kai-ink hover:bg-green-400 min-h-[36px] text-xs">✓</button>
                                  )}
                                  <button onClick={async () => { await handleCancelBooking(booking.id); sendDiscordConfirmation(booking, 'cancel'); }} className="px-3 py-2 bg-red-500 text-kai-ink font-bold border border-kai-ink hover:bg-red-400 min-h-[36px] text-xs">✗</button>
                                  <select onChange={(e) => { if (e.target.value) handleChangeStation(booking.id, e.target.value); }} className="px-2 py-2 bg-kai-dark text-kai-text border border-kai-ink text-xs min-h-[36px]" defaultValue="">
                                    <option value="" disabled>Move</option>
                                    {stations.filter((st) => st.id !== booking.stationId && st.status === 'open').map((st) => (
                                      <option key={st.id} value={st.id}>{st.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-kai-muted text-xs py-2">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Stations Tab ─── */}
        {tab === 'stations' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <button onClick={handleOpenAll} className="btn-neo bg-green-600 text-kai-ink flex items-center gap-2 text-sm"><Power size={14} /> Open All</button>
              <button onClick={handleCloseAll} className="btn-neo bg-kai-red text-kai-ink flex items-center gap-2 text-sm"><PowerOff size={14} /> Close All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stations.map((station) => (
                <div key={station.id} className="card-neo p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{station.name}</h3>
                    <span className={`text-xs font-bold uppercase px-2 py-1 border-2 ${station.status === 'open' ? 'text-green-400 bg-green-500/20 border-green-500' : station.status === 'closed' ? 'text-red-400 bg-red-500/20 border-red-500' : 'text-yellow-400 bg-yellow-500/20 border-yellow-500'}`}>{station.status}</span>
                  </div>
                  <p className="text-kai-muted text-xs mb-4">{station.games.join(', ')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['open', 'full', 'closed'] as const).map((s) => (
                      <button key={s} onClick={() => handleStationToggle(station.id, s)} className={`px-3 py-2 text-xs font-bold border-3 border-kai-ink transition-colors ${station.status === s ? (s === 'open' ? 'bg-green-500 text-kai-ink' : s === 'full' ? 'bg-yellow-500 text-kai-ink' : 'bg-red-500 text-kai-ink') : 'bg-kai-surface text-kai-text hover:bg-kai-dark'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Bookings Tab ─── */}
        {tab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">All Bookings ({bookings.length})</h2>
              <button onClick={clearAllBookings} className="btn-neo bg-kai-red text-kai-ink text-sm">Clear All</button>
            </div>
            {bookings.length === 0 ? (
              <div className="card-neo p-8 text-center"><p className="text-kai-muted">No bookings yet.</p></div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="card-neo p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold">{b.customerName} — {b.customerPhone}</div>
                        <div className="text-kai-muted text-xs">{stations.find((s) => s.id === b.stationId)?.name ?? b.stationId} | {b.date} | {b.timeSlot}</div>
                        {b.game && <div className="text-kai-red text-xs font-bold mt-1">Game: {b.game}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase px-2 py-1.5 border-2 ${b.status === 'confirmed' ? 'text-green-400 border-green-500' : b.status === 'cancelled' ? 'text-red-400 border-red-500' : 'text-yellow-400 border-yellow-500'}`}>{b.status}</span>
                        <select onChange={(e) => { if (e.target.value) handleChangeStation(b.id, e.target.value); }} className="px-2 py-2 bg-kai-dark text-kai-text border border-kai-ink text-xs min-h-[36px]" defaultValue="">
                          <option value="" disabled>Move to...</option>
                          {stations.filter((st) => st.id !== b.stationId && st.status === 'open').map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                        {b.status === 'pending' && (
                          <button onClick={async () => { await handleConfirmBooking(b.id); sendDiscordConfirmation(b, 'confirm'); }} className="px-3 py-2 bg-green-500 text-kai-ink font-bold border-2 border-kai-ink text-xs min-h-[36px]">Confirm</button>
                        )}
                        <button onClick={async () => { await handleCancelBooking(b.id); sendDiscordConfirmation(b, 'cancel'); }} className="px-3 py-2 bg-red-500 text-kai-ink font-bold border-2 border-kai-ink text-xs min-h-[36px]">Cancel</button>
                        <button onClick={() => handleDeleteBooking(b.id)} className="px-3 py-2 bg-kai-surface text-kai-text font-bold border-2 border-kai-ink text-xs min-h-[36px]">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Discord Tab ─── */}
        {tab === 'discord' && (
          <div className="space-y-6">
            <div className="card-neo p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><MessageCircle size={20} className="text-kai-red" /> Webhook Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${DISCORD_WEBHOOK_URL ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-bold ${DISCORD_WEBHOOK_URL ? 'text-green-400' : 'text-red-400'}`}>{DISCORD_WEBHOOK_URL ? 'Configured' : 'Not configured'}</span>
              </div>
            </div>
            <div className="card-neo p-6">
              <h3 className="font-bold mb-4">Test Webhook</h3>
              <p className="text-kai-muted text-sm mb-4">Send a test notification to your Discord channel.</p>
              <button onClick={handleTestWebhook} className="btn-neo bg-kai-red text-kai-ink flex items-center gap-2 text-sm"><Send size={14} /> Send Test</button>
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {tab === 'settings' && settings && (
          <div className="space-y-6">
            <div className="card-neo p-6">
              <h3 className="font-bold mb-4">Contact Info</h3>
              <div className="space-y-3">
                {[{ key: 'phone' as const, label: 'Phone' }, { key: 'whatsapp' as const, label: 'WhatsApp' }, { key: 'instagram' as const, label: 'Instagram' }, { key: 'email' as const, label: 'Email' }, { key: 'address' as const, label: 'Address' }, { key: 'workingHours' as const, label: 'Hours' }].map(({ key, label }) => (
                  <div key={key}><label className="block text-xs font-bold text-kai-muted mb-1">{label}</label><input type="text" value={settings[key]} onChange={(e) => updateSetting(key, e.target.value)} className="input-neo text-sm" /></div>
                ))}
              </div>
            </div>
            <div className="card-neo p-6">
              <h3 className="font-bold mb-4">Pricing</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'superHours' as const, label: 'Super Hours' }, { key: 'quickPlay' as const, label: 'Quick Play' }, { key: 'storyMode' as const, label: 'Story Mode' }].map(({ key, label }) => (
                  <div key={key}><label className="block text-xs font-bold text-kai-muted mb-1">{label}</label><input type="text" value={settings.pricing[key]} onChange={(e) => updatePricing(key, e.target.value)} className="input-neo text-sm" /></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
