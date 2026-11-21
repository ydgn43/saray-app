import React from 'react';

type State = { error: Error | null };

/**
 * Catches errors while rendering so the user never sees a blank white page.
 * Shows a short message with a reload button and the technical error text,
 * which tells us what failed on that device.
 */
export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="notranslate"
        translate="no"
        style={{ maxWidth: 480, margin: '15vh auto 0', padding: '0 16px', textAlign: 'center' }}
      >
        <h4>Bir hata oluştu</h4>
        <p>Sayfa yüklenirken bir sorun çıktı. Lütfen sayfayı yenileyin.</p>
        <button type="button" className="btn btn-dark" onClick={() => window.location.reload()}>
          <span>Sayfayı yenile</span>
        </button>
        <pre
          style={{
            marginTop: 24,
            fontSize: '0.7rem',
            color: '#777',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'left'
          }}
        >
          {String(error.message || error)}
        </pre>
      </div>
    );
  }
}
