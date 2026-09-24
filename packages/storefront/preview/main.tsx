import {ui} from '../app/content/recovery-ui';
import '../app/features/recovery/recovery.css';
import {StrictMode, Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import {Experience} from '../app/features/recovery/Experience';
class PreviewErrorBoundary extends Component<
  {children: ReactNode},
  {failed: boolean}
> {
  state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  render() {
    return this.state.failed ? (
      <main className="page empty-state">
        <h1>{ui.let_s_try_that_again_5d2389}</h1>
        <p>{ui.the_preview_could_not_load_refresh_to_restart_6cb6de}</p>
        <a className="button" href="/">
          {ui.reload_regenai_ffa2bc}
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
const container = document.getElementById('root');
if (!container) throw new Error('Missing application root');
createRoot(container).render(
  <StrictMode>
    <PreviewErrorBoundary>
      <BrowserRouter>
        <Experience />
      </BrowserRouter>
    </PreviewErrorBoundary>
  </StrictMode>,
);
