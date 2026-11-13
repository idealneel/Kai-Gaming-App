import { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, Gamepad2 } from 'lucide-react';
import { createBooking, subscribeToStations, TIME_SLOTS, toDateKey, type Station } from '../firebase/bookings';
import { useSettings } from '../hooks/useSettings';
import { useInView } from '../hooks/useInView';

type Step = 'date' | 'slot' | 'game' | 'form' | 'confirm';

const ALL_GAMES = [
  'WWE 2K25', 'Spider-Man 2', 'God of War Ragnarok', 'FC25', 'Tekken 8',
  'Mortal Kombat', 'GTA 5', 'Ghost of Tsushima', 'The Last of Us', 'Cricket 24',
  'Asphalt Racing', 'A Way Out', 'It Takes Two', 'Uncharted 4', 'Watch Dogs',
  'Horizon Forbidden West',
];

export default function Booking() {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(false);
  const [stepKey, setStepKey] = useState(0);

  const settings = useSettings();
  const [heroRef, heroInView] = useInView(0.1);
  const [flowRef] = useInView(0.1);

  useEffect(() => {
    return subscribeToStations((loadedStations) => {
      setStations(loadedStations);
      setStationsLoading(false);
    }, () => setStationsError(true));
  }, []);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: toDateKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday: i === 0,
    };
  });

  const goToStep = (s: Step) => {
    setStepKey((k) => k + 1);
    setStep(s);
  };

  const handleBooking = async () => {
    if (!formData.name || !formData.phone) {
      setError('Please fill in your name and phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createBooking({
        stationId: selectedStation,
        date: selectedDate,
        timeSlot: selectedSlot,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        game: selectedGame,
      });
      if (result.success) {
        goToStep('confirm');
      } else {
        setError(result.error || 'Failed to create booking. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep('date');
    setSelectedDate('');
    setSelectedSlot('');
    setSelectedStation('');
    setSelectedGame('');
    setFormData({ name: '', phone: '', email: '' });
    setError('');
    setStepKey(0);
  };

  const phoneDigits = settings.whatsapp.replace(/[^0-9]/g, '');
  const openStations = stations.filter((station) => station.status === 'open');
  const steps: Step[] = ['date', 'slot', 'game', 'form', 'confirm'];

  return (
    <div>
      {/* Hero */}
      <section ref={heroRef} className="py-20 bg-kai-dark">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal ${heroInView ? 'visible' : ''}`}>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[0.95]">
            BOOK YOUR <span className="text-kai-red">STATION</span>
          </h1>
          <p className="text-kai-muted text-lg max-w-xl mx-auto">Choose a date, station, time, and game. We'll confirm your booking request.</p>
        </div>
      </section>

      {/* Booking Flow */}
      <section ref={flowRef} className="py-12 bg-kai-deeper min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-12">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-3 border-kai-ink font-bold text-xs sm:text-sm transition-all duration-300 ${
                  step === s ? 'bg-kai-red text-kai-ink scale-110' :
                  steps.indexOf(step) > i ? 'bg-kai-red/30 text-kai-text' : 'bg-kai-surface text-kai-muted'
                }`}>{i + 1}</div>
                {i < steps.length - 1 && <div className={`w-4 sm:w-10 h-1 transition-all duration-500 ${steps.indexOf(step) > i ? 'bg-kai-red' : 'bg-kai-ink'}`} />}
              </div>
            ))}
          </div>

          <div key={stepKey} className="step-slide-enter">
            {/* Step 1: Date */}
            {step === 'date' && (
              <div>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Calendar size={24} className="text-kai-red" /> Pick a Date</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dates.map((date) => (
                    <button key={date.value} onClick={() => { setSelectedDate(date.value); goToStep('slot'); }}
                      className={`card-neo p-4 text-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm hover:scale-105 active:scale-95 transition-all duration-150 ${date.isToday ? 'border-kai-red pulse-glow' : ''}`}>
                      {date.isToday && <div className="bg-kai-red text-kai-ink text-xs font-bold uppercase px-2 py-0.5 mb-2 inline-block">Today</div>}
                      <div className="font-bold text-sm">{date.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Time Slot */}
            {step === 'slot' && (
              <div>
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><Clock size={24} className="text-kai-red" /> Choose Time Slot</h2>
                <p className="text-kai-muted mb-6">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-kai-muted mb-6">Choose the time you would like to request. Your booking is pending until our team confirms it.</p>
                <div className="space-y-6">
                  {stationsError && (
                    <div role="alert" className="card-neo p-4 border-kai-red bg-kai-red/10 text-sm text-kai-red">
                      Live station status could not be loaded. Default stations are shown; contact us if your request cannot be submitted.
                    </div>
                  )}
                  {stationsLoading && (
                    <div role="status" className="card-neo p-6 text-center text-kai-muted">Loading stations…</div>
                  )}
                  {openStations.map((station) => (
                    <div key={station.id} className="card-neo p-6">
                      <h3 className="font-bold mb-4">{station.name}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button key={slot}
                            aria-label={`Request ${slot} at ${station.name}`}
                            onClick={() => { setSelectedStation(station.id); setSelectedSlot(slot); goToStep('game'); }}
                            className="px-3 py-2 text-xs font-bold border-3 border-kai-ink transition-all duration-100 bg-kai-dark text-kai-text hover:bg-kai-red hover:text-kai-ink hover:translate-x-[1px] hover:translate-y-[1px]">
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!stationsLoading && openStations.length === 0 && (
                    <div className="card-neo p-8 text-center">
                      <AlertCircle size={48} className="text-kai-red mx-auto mb-4" />
                      <p className="text-kai-muted">No stations available right now.</p>
                    </div>
                  )}
                </div>
                <button onClick={() => goToStep('date')} className="btn-neo bg-kai-surface text-kai-text mt-6">← Back</button>
              </div>
            )}

            {/* Step 3: Game Selection */}
            {step === 'game' && (
              <div>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Gamepad2 size={24} className="text-kai-red" /> Select a Game</h2>
                <p className="text-kai-muted mb-6">
                  {stations.find((s) => s.id === selectedStation)?.name} — {selectedSlot}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ALL_GAMES.map((game) => (
                    <button key={game} onClick={() => { setSelectedGame(game); goToStep('form'); }}
                      className={`card-neo p-4 text-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm hover:scale-105 active:scale-95 transition-all duration-150 ${
                        selectedGame === game ? 'border-kai-red bg-kai-red/10' : ''
                      }`}>
                      <span className="text-sm font-bold">{game}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => goToStep('slot')} className="btn-neo bg-kai-surface text-kai-text mt-6">← Back</button>
              </div>
            )}

            {/* Step 4: Customer Form */}
            {step === 'form' && (
              <div>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><User size={24} className="text-kai-red" /> Your Details</h2>
                <div className="card-neo p-6 mb-6">
                  <div className="text-sm text-kai-muted mb-2">Booking Summary</div>
                  <div className="font-bold">{stations.find((s) => s.id === selectedStation)?.name} — {selectedSlot}</div>
                  <div className="text-sm text-kai-muted">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="text-sm text-kai-red font-bold mt-1">Game: {selectedGame}</div>
                </div>
                {error && (
                  <div className="card-neo p-4 mb-6 border-kai-red bg-kai-red/10 flex items-center gap-2">
                    <AlertCircle size={16} className="text-kai-red" /><span className="text-sm text-kai-red">{error}</span>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-neo" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Phone *</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-neo" placeholder="+91 9730093803" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Email (optional)</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-neo" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-8">
                  <button onClick={() => goToStep('game')} className="btn-neo bg-kai-surface text-kai-text">← Back</button>
                  <button onClick={handleBooking} disabled={loading || !formData.name || !formData.phone} className="btn-neo bg-kai-red text-kai-ink flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Sending...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {step === 'confirm' && (
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-kai-red flex items-center justify-center border-3 border-kai-ink shadow-neo-lg relative z-10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16171B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" className="draw-check" />
                    </svg>
                  </div>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="confetti-particle absolute w-3 h-3 border-2 border-kai-ink"
                      style={{ background: i % 2 === 0 ? '#D42424' : '#24D4D4', top: '50%', left: '50%',
                        '--tx': `${(Math.random() - 0.5) * 160}px`, '--ty': `${(Math.random() - 0.5) * 160}px`,
                        animationDelay: `${i * 0.05}s`,
                      } as React.CSSProperties} />
                  ))}
                </div>
                <h2 className="text-3xl font-black mb-4">BOOKING SENT!</h2>
                <p className="text-kai-muted mb-2">Thanks, {formData.name}! Your booking request has been sent.</p>
                <p className="text-kai-muted text-sm mb-6">We'll confirm your slot shortly on WhatsApp.</p>
                <div className="card-neo p-6 max-w-md mx-auto mb-8">
                  <div className="text-sm text-kai-muted mb-1">Station</div>
                  <div className="font-bold mb-3">{stations.find((s) => s.id === selectedStation)?.name}</div>
                  <div className="text-sm text-kai-muted mb-1">Game</div>
                  <div className="font-bold mb-3 text-kai-red">{selectedGame}</div>
                  <div className="text-sm text-kai-muted mb-1">Date</div>
                  <div className="font-bold mb-3">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="text-sm text-kai-muted mb-1">Time</div>
                  <div className="font-bold">{selectedSlot}</div>
                </div>
                <div className="flex justify-center gap-4">
                  <a href={`https://wa.me/${phoneDigits}?text=Hi, I just booked a PS5 at KaiGaming on ${selectedDate} at ${selectedSlot} for ${selectedGame}. My name is ${formData.name}.`} target="_blank" rel="noopener noreferrer" className="btn-neo bg-kai-surface text-kai-text">Confirm on WhatsApp</a>
                  <button onClick={resetBooking} className="btn-neo bg-kai-red text-kai-ink">Book Another</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
