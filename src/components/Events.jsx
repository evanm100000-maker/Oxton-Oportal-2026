import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Events() {
  const { events } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          padding: '10px', 
          borderRadius: '10px', 
          background: 'rgba(16, 185, 129, 0.15)', 
          color: '#34d399',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Calendar size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#fff' }}>Upcoming Events</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {(!events || events.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', gridColumn: '1 / -1' }}>
            <Calendar size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            No events scheduled. Check back later!
          </div>
        ) : (
          events.map((event, index) => (
            <motion.div 
              key={event.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.05)'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', minWidth: '70px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ color: '#34d399', fontWeight: '800', fontSize: '1.5rem', lineHeight: '1' }}>{new Date(event.date).getDate()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginTop: '4px', fontWeight: '600' }}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{event.title}</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px', lineHeight: '1.5' }}>{event.description}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
