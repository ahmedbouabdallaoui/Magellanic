export default function AchievementBadge({ badge, earned = false }) {
  return (
    <div className={`badge-card ${earned ? 'badge-earned' : 'badge-locked'}`}>
      <div className="badge-icon">
        {badge.type === 'discovery' ? '✦' : badge.type === 'mastery' ? '✧' : '★'}
      </div>
      <div className="badge-info">
        <h3 className="badge-name">{badge.constellation_name || badge.name}</h3>
        <p className="badge-caption">{badge.caption}</p>
      </div>
    </div>
  );
}
