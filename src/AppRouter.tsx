import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import { Home } from "./pages/Home";
import { Articles } from "./pages/Articles";
import { Notes } from "./pages/Notes";
import { About } from "./pages/About";
import { Publish } from "./pages/Publish";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artikel" element={<Articles />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/about" element={<About />} />
            <Route path="/veroeffentlichen" element={<Publish />} />
            {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
            <Route path="/:nip19" element={<NIP19Page />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
export default AppRouter;