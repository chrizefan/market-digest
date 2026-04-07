import PropTypes from 'prop-types';

/** Reusable stat card for KPI display */
export function StatCard({ label, value, icon: Icon, iconColor = 'text-fin-blue', subtitle, valueClass = '' }) {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
        {Icon && <Icon size={16} className={iconColor} />}
      </div>
      <div className={`text-3xl font-bold tabular-nums mt-2 ${valueClass}`}>
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-text-muted mt-2">{subtitle}</p>
      )}
    </div>
  );
}

/** Badge variant */
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white/10 text-text-secondary border-border-subtle',
    blue: 'bg-fin-blue/15 text-fin-blue border-fin-blue/30',
    green: 'bg-fin-green/15 text-fin-green border-fin-green/30',
    red: 'bg-fin-red/15 text-fin-red border-fin-red/30',
    amber: 'bg-fin-amber/15 text-fin-amber border-fin-amber/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Section heading used inside pages */
export function SectionTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold mb-3 ${className}`}>{children}</h3>
  );
}

/** Format percentage with sign */
export function formatPct(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** Return Tailwind color class for positive/negative */
export function pnlColor(v) {
  if (v == null) return '';
  return v >= 0 ? 'text-fin-green' : 'text-fin-red';
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  subtitle: PropTypes.node,
  valueClass: PropTypes.string,
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'blue', 'green', 'red', 'amber']),
  className: PropTypes.string,
};

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
