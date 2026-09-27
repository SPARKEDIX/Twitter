import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Follow from './pages/Follow';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
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
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/follow" element={<Follow />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Chat />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/bookmarks" element={<Navigate to="/" replace />} />
          <Route path="/lists" element={<Navigate to="/" replace />} />
          <Route path="/more" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;