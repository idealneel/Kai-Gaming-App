import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { isFirebaseConfigured } from '../../firebase/config';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {!isFirebaseConfigured && (
          <div role="status" className="bg-kai-red/15 border-b-3 border-kai-ink px-4 py-3 text-center text-sm text-kai-text">
            Firebase is not configured. Online booking and admin sign-in are unavailable until you add Firebase settings to your local <code>.env</code> file.
          </div>
        )}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
