import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * Filet de sécurité de toute l'application : si un écran plante, on affiche un message et un bouton pour recharger,
 * au lieu d'une page blanche. Les formulaires publics gardent ce qui a été saisi (brouillon), on le retrouve au rechargement.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur d’affichage interceptée :', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        data-testid="app-error"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Oups, un petit souci d’affichage</p>
          <p style={{ fontSize: 14, color: '#4b5563', margin: '0 0 6px', lineHeight: 1.5 }}>
            Recharge la page : ce que tu avais déjà saisi est en principe conservé.
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
            Si ton navigateur propose de traduire la page, choisis « Ne jamais traduire » : l’application est en français.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              height: 48,
              border: 'none',
              borderRadius: 12,
              background: '#00665C',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Recharger la page
          </button>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, wordBreak: 'break-word' }}>{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}
