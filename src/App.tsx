import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Preloader from './components/Preloader';
import { registerSW } from './utils/registerSW';
import './App.css';
import './index.css';

registerSW();

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Preloader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="/notifications" element={<Navigate to="/" replace />} />
          <Route path="/messages" element={<Navigate to="/" replace />} />
          <Route path="/bookmarks" element={<Navigate to="/" replace />} />
          <Route path="/lists" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<Navigate to="/" replace />} />
          <Route path="/more" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;