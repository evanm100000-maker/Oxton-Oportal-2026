import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, Plane, Calendar as CalendarIcon, Users, AlertTriangle } from 'lucide-react';

export default function CalendarPage() {
  const { flights = [], events = [], meetings = [], unavailableDates = [] } = useApp();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [selectedDate, setSelectedDate] = useState(null);

  const handleNavigateToActivity = (type, item) => {
    const url = new URL(window.location.href);
    if (type === 'flight') {
      url.pathname = '/allocation-requests';
      url.searchParams.set('flightId', item.id);
    } else if (type === 'event') {
      url.pathname = '/events';
    } else if (type === 'meeting') {
      url.pathname = '/meetings';
    }
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format date as YYYY-MM-DD
  const formatDateStr = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Group activities by date for fast lookup
  const activitiesByDate = useMemo(() => {
    const map = {};
    
    // Process Unavailable Dates
    if (unavailableDates && Array.isArray(unavailableDates)) {
      unavailableDates.forEach(ud => {
        if (!map[ud.date]) map[ud.date] = { flights: [], events: [], meetings: [], unavailable: true };
        else map[ud.date].unavailable = true;
      });
    }

    const getDateString = (dateVal) => {
      if (!dateVal) return null;
      if (typeof dateVal === 'string' && dateVal.length === 10 && dateVal.indexOf('T') === -1 && dateVal.includes('-')) {
        return dateVal;
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Process Flights
    if (flights && Array.isArray(flights)) {
      flights.forEach(f => {
        const dStr = getDateString(f.date);
        if (dStr) {
          if (!map[dStr]) map[dStr] = { flights: [], events: [], meetings: [], unavailable: false };
          map[dStr].flights.push(f);
        }
      });
    }

    // Process Events
    if (events && Array.isArray(events)) {
      events.forEach(e => {
        const dStr = getDateString(e.date);
        if (dStr) {
          if (!map[dStr]) map[dStr] = { flights: [], events: [], meetings: [], unavailable: false };
          map[dStr].events.push(e);
        }
      });
    }

    // Process Meetings
    if (meetings && Array.isArray(meetings)) {
      meetings.forEach(m => {
        const dStr = getDateString(m.date);
        if (dStr) {
          if (!map[dStr]) map[dStr] = { flights: [], events: [], meetings: [], unavailable: false };
          map[dStr].meetings.push(m);
        }
      });
    }

    return map;
  }, [flights, events, meetings, unavailableDates]);

  const renderMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex); // 0 = Sun, 1 = Mon...
    
    const days = [];
    // Padding days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${monthIndex}-${i}`} style={styles.emptyDay} />);
    }
    
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(currentYear, monthIndex, d);
      const activity = activitiesByDate[dateStr];
      const hasActivity = activity && (activity.flights.length > 0 || activity.events.length > 0 || activity.meetings.length > 0);
      const isUnavailable = activity?.unavailable;

      let bg = 'rgba(255, 255, 255, 0.02)';
      let border = '1px solid rgba(255, 255, 255, 0.05)';
      let color = '#d1d5db';
      
      if (isUnavailable) {
        bg = 'rgba(239, 68, 68, 0.15)';
        border = '1px solid rgba(239, 68, 68, 0.3)';
        color = '#fca5a5';
      } else if (hasActivity) {
        bg = 'rgba(59, 130, 246, 0.1)';
        border = '1px solid rgba(59, 130, 246, 0.3)';
      }

      const todayStr = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      const isToday = dateStr === todayStr;

      if (isToday) {
        border = '1px solid #10b981';
      }

      days.push(
        <motion.div 
          key={d} 
          whileHover={{ scale: 1.1, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDate(dateStr)}
          style={{
            ...styles.dayCell,
            background: bg,
            border: border,
            color: color,
            position: 'relative'
          }}
        >
          {d}
          <div style={styles.indicatorContainer}>
            {activity?.flights?.length > 0 && <div style={{...styles.dot, background: '#3b82f6'}} />}
            {activity?.events?.length > 0 && <div style={{...styles.dot, background: '#10b981'}} />}
            {activity?.meetings?.length > 0 && <div style={{...styles.dot, background: '#8b5cf6'}} />}
          </div>
          {isUnavailable && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239, 68, 68, 0.1) 4px, rgba(239, 68, 68, 0.1) 8px)', borderRadius: '4px', pointerEvents: 'none' }} />
          )}
        </motion.div>
      );
    }

    return (
      <div key={monthIndex} style={styles.monthCard} className="glass-panel">
        <h3 style={styles.monthTitle}>{months[monthIndex]}</h3>
        <div style={styles.weekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} style={styles.weekdayLabel}>{day}</div>
          ))}
        </div>
        <div style={styles.daysGrid}>
          {days}
        </div>
      </div>
    );
  };

  const selectedData = selectedDate ? activitiesByDate[selectedDate] : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconWrapper}>
            <Calendar size={28} color="#f59e0b" />
          </div>
          <div>
            <h1 style={styles.title}>Yearly Calendar</h1>
            <p style={styles.subtitle}>Overview of all scheduled activities and blackouts</p>
          </div>
        </div>
        <div style={styles.yearSelector}>
          <div style={{ display: 'flex', gap: '8px', marginRight: '16px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setViewMode('month')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'month' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: viewMode === 'month' ? '#f59e0b' : '#9ca3af', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('year')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'year' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: viewMode === 'year' ? '#f59e0b' : '#9ca3af', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
            >
              Year
            </button>
          </div>

          <button onClick={() => {
            if (viewMode === 'year') {
              setCurrentYear(y => y - 1);
            } else {
              if (currentMonthIndex === 0) {
                setCurrentMonthIndex(11);
                setCurrentYear(y => y - 1);
              } else {
                setCurrentMonthIndex(m => m - 1);
              }
            }
          }} className="btn-secondary" style={styles.yearBtn}>
            <ChevronLeft size={20} />
          </button>
          <span style={styles.yearText}>
            {viewMode === 'month' ? `${months[currentMonthIndex]} ${currentYear}` : currentYear}
          </span>
          <button onClick={() => {
            if (viewMode === 'year') {
              setCurrentYear(y => y + 1);
            } else {
              if (currentMonthIndex === 11) {
                setCurrentMonthIndex(0);
                setCurrentYear(y => y + 1);
              } else {
                setCurrentMonthIndex(m => m + 1);
              }
            }
          }} className="btn-secondary" style={styles.yearBtn}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#3b82f6'}} /> Flights</div>
        <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#10b981'}} /> Events</div>
        <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#8b5cf6'}} /> Meetings</div>
        <div style={styles.legendItem}>
          <div style={{width: '14px', height: '14px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)'}} /> 
          Unavailable Date
        </div>
      </div>

      <motion.div 
        key={`${viewMode}-${currentYear}-${currentMonthIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={viewMode === 'year' ? styles.yearGrid : styles.monthGrid}
      >
        {viewMode === 'year' 
          ? months.map((_, index) => renderMonth(index))
          : renderMonth(currentMonthIndex)
        }
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedDate && (
          <div style={styles.modalOverlay} onClick={() => setSelectedDate(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={styles.modalContent}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <button onClick={() => setSelectedDate(null)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={styles.modalBody}>
                {selectedData?.unavailable && (
                  <div style={styles.unavailableAlert}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <span>This date is marked as Unavailable for flights.</span>
                  </div>
                )}

                {(!selectedData || (!selectedData.unavailable && selectedData.flights.length === 0 && selectedData.events.length === 0 && selectedData.meetings.length === 0)) && (
                  <div style={styles.emptyDayAlert}>
                    No activities scheduled for this date.
                  </div>
                )}

                {selectedData?.flights?.length > 0 && (
                  <div style={styles.activitySection}>
                    <h4 style={{...styles.sectionTitle, color: '#3b82f6'}}><Plane size={16} /> Scheduled Flights</h4>
                    <div style={styles.activityList}>
                      {selectedData.flights.map(f => (
                        <div key={f.id} onClick={() => handleNavigateToActivity('flight', f)} style={{...styles.activityCard, cursor: 'pointer'}}>
                          <div style={styles.activityTop}>
                            <span style={{fontWeight: 'bold', color: '#fff'}}>{f.flightCode}</span>
                            <span style={{fontSize: '0.85rem', color: '#9ca3af'}}>{f.time}</span>
                          </div>
                          <div style={{fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px'}}>Host: {f.host}</div>
                          <div style={{fontSize: '0.85rem', color: '#cbd5e1'}}>Location: {f.location}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedData?.events?.length > 0 && (
                  <div style={styles.activitySection}>
                    <h4 style={{...styles.sectionTitle, color: '#10b981'}}><CalendarIcon size={16} /> Special Events</h4>
                    <div style={styles.activityList}>
                      {selectedData.events.map(e => (
                        <div key={e.id} onClick={() => handleNavigateToActivity('event', e)} style={{...styles.activityCard, cursor: 'pointer'}}>
                          <div style={styles.activityTop}>
                            <span style={{fontWeight: 'bold', color: '#fff'}}>{e.title}</span>
                          </div>
                          {e.description && <div style={{fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px'}}>{e.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedData?.meetings?.length > 0 && (
                  <div style={styles.activitySection}>
                    <h4 style={{...styles.sectionTitle, color: '#8b5cf6'}}><Users size={16} /> Meetings</h4>
                    <div style={styles.activityList}>
                      {selectedData.meetings.map(m => (
                        <div key={m.id} onClick={() => handleNavigateToActivity('meeting', m)} style={{...styles.activityCard, cursor: 'pointer'}}>
                          <div style={styles.activityTop}>
                            <span style={{fontWeight: 'bold', color: '#fff'}}>{m.title}</span>
                          </div>
                          {m.description && <div style={{fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px'}}>{m.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(245, 158, 11, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    margin: 0,
  },
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(0,0,0,0.2)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  yearBtn: {
    padding: '8px',
    borderRadius: '8px',
  },
  yearText: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#fff',
    minWidth: '60px',
    textAlign: 'center',
  },
  legend: {
    display: 'flex',
    gap: '24px',
    padding: '0 12px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    color: '#cbd5e1',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  yearGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  monthGrid: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    overflowX: 'auto',
    paddingBottom: '10px',
  },
  monthCard: {
    padding: 'clamp(10px, 3vw, 20px)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    minWidth: '320px',
  },
  monthTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    marginBottom: '4px',
  },
  weekdayLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  emptyDay: {
    aspectRatio: '1',
  },
  dayCell: {
    aspectRatio: '1',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  indicatorContainer: {
    display: 'flex',
    gap: '2px',
    position: 'absolute',
    bottom: '4px',
  },
  dot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    background: '#1e293b',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '20px 20px 0 0',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#9ca3af',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  unavailableAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '16px',
    borderRadius: '12px',
    color: '#ef4444',
    fontWeight: '500',
  },
  emptyDayAlert: {
    textAlign: 'center',
    padding: '30px',
    color: '#9ca3af',
    fontStyle: 'italic',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  activitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '8px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityCard: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '12px 16px',
    borderRadius: '10px',
  },
  activityTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
};
