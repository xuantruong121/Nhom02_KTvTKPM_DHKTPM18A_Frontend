import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './core/router/AppRoutes';
import './shared/styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
