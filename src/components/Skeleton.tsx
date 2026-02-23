export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'hsl(20 6% 10%)',
        border: '1px solid hsl(15 8% 16%)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '180px',
          background: 'linear-gradient(90deg, hsl(20 6% 12%) 25%, hsl(20 6% 15%) 50%, hsl(20 6% 12%) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div className="p-5 space-y-3">
        <div style={{ height: '10px', width: '40%', background: 'hsl(20 6% 16%)', borderRadius: '2px' }} />
        <div style={{ height: '16px', width: '75%', background: 'hsl(20 6% 16%)', borderRadius: '2px' }} />
        <div style={{ height: '12px', width: '90%', background: 'hsl(20 6% 14%)', borderRadius: '2px' }} />
        <div style={{ height: '12px', width: '65%', background: 'hsl(20 6% 14%)', borderRadius: '2px' }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: 'hsl(20 6% 10%)',
        border: '1px solid hsl(15 8% 16%)',
        borderRadius: '4px',
        height: '320px',
      }}
    />
  );
}
