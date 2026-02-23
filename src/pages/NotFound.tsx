import { Link } from 'wouter';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif mb-4" style={{ fontSize: '5rem', color: 'hsl(15 8% 18%)', lineHeight: 1 }}>⟁</p>
        <h1
          className="font-serif font-black uppercase tracking-wide mb-3"
          style={{ fontSize: '2.5rem', color: 'hsl(15 4% 65%)' }}
        >
          Path Not Found
        </h1>
        <p className="font-display italic mb-8" style={{ color: 'hsl(15 4% 38%)' }}>
          These tunnels lead nowhere you were meant to go.
        </p>
        <Link href="/">
          <span
            className="font-serif text-sm uppercase tracking-wider cursor-pointer transition-colors"
            style={{ color: 'hsl(25 80% 38%)' }}
          >
            ← Return to the Vault
          </span>
        </Link>
      </div>
    </div>
  );
}
