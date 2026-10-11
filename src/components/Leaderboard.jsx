import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Medal, Award, User, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function Leaderboard() {
  const { activeUsers, applicationConfig } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    if (!applicationConfig?.nextPointResetDate) return;
    
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(applicationConfig.nextPointResetDate);
      const diff = target - now;
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft({ days, hours, minutes });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [applicationConfig?.nextPointResetDate]);

  // Sort users by points, descending. Filter out users with 0 points if desired, 
  // but let's show everyone who has points or just sort everyone.
  const sortedUsers = [...activeUsers]
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const displayedUsers = showAll ? sortedUsers : sortedUsers.slice(0, 10);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Trophy size={32} color="#f59e0b" style={{ marginBottom: '10px' }} />
        <h2 style={styles.title}>Staff of the Week</h2>
        <p style={styles.subtitle}>
          Recognizing our most dedicated staff based on approved flight logs and admin awards.
        </p>
        {applicationConfig?.nextPointResetDate && (
          <div style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '600' }}>
              Points Reset In: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        )}
      </div>

      <div style={styles.list}>
        {displayedUsers.map((user, index) => {
          const isTop3 = index < 3;
          const points = user.points || 0;
          
          let RankIcon = null;
          let rankColor = '';
          if (index === 0) {
            RankIcon = Trophy;
            rankColor = '#f59e0b'; // Gold
          } else if (index === 1) {
            RankIcon = Medal;
            rankColor = '#9ca3af'; // Silver
          } else if (index === 2) {
            RankIcon = Award;
            rankColor = '#b45309'; // Bronze
          }

          return (
            <div 
              key={user.email} 
              className={`glass-panel ${index === 0 ? 'glass-panel-glow slam-element' : ''}`}
              style={{
                ...styles.card,
                transform: index === 0 ? 'scale(1.02)' : 'none',
                border: index === 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined,
                boxShadow: index === 0 ? '0 10px 30px rgba(245, 158, 11, 0.15)' : undefined
              }}
            >
              <div style={styles.rankBadge}>
                {isTop3 ? (
                  <RankIcon size={24} color={rankColor} />
                ) : (
                  <span style={styles.rankNumber}>#{index + 1}</span>
                )}
              </div>

              <div style={styles.userInfo}>
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.firstName} style={styles.avatar} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    <User size={20} color="var(--color-text-muted)" />
                  </div>
                )}
                <div style={styles.nameContainer}>
                  <h3 style={styles.userName}>
                    {user.firstName} {user.lastName}
                  </h3>
                  <span style={styles.userHandle}>@{user.robloxUsername}</span>
                </div>
              </div>

              <div style={styles.pointsContainer}>
                <span style={styles.pointsNumber}>{points}</span>
                <span style={styles.pointsLabel}>Points</span>
              </div>
            </div>
          );
        })}

        {sortedUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            No staff data available yet.
          </div>
        )}

        {sortedUsers.length > 10 && (
          <button 
            onClick={() => setShowAll(!showAll)} 
            className="btn-secondary" 
            style={{ margin: '16px auto', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {showAll ? (
              <><ChevronUp size={16} /> Show Less</>
            ) : (
              <><ChevronDown size={16} /> View All Staff</>
            )}
          </button>
        )}
      </div>

      <div style={{...styles.card, marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'}} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-text-main)' }}>
          <Info size={20} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>How Points Work</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#10b981' }}>
              <TrendingUp size={16} />
              <h4 style={{ margin: 0 }}>Earning Points</h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>+7</strong> for attending a flight (approved flight log)</li>
              <li><strong>+3</strong> for completing an assigned task</li>
              <li><strong>+2</strong> for your report being accepted</li>
              <li>Points can also be awarded directly by Admins</li>
            </ul>
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#ef4444' }}>
              <TrendingDown size={16} />
              <h4 style={{ margin: 0 }}>Losing Points</h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>-2</strong> missing a flight (while not on LOA)</li>
              <li><strong>-2</strong> Informal Sanction</li>
              <li><strong>-10</strong> Formal Infraction</li>
              <li><strong>-20</strong> Suspension</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          <em>Note: You can earn additional points from admins.</em>
        </div>
      </div>
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
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(245, 158, 11, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(245, 158, 11, 0.1)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f59e0b',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    gap: '20px',
    transition: 'transform 0.2s',
  },
  rankBadge: {
    width: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--color-border)',
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
  },
  nameContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  userHandle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
  },
  pointsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
  },
  pointsNumber: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-primary)',
    lineHeight: '1',
  },
  pointsLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
};
