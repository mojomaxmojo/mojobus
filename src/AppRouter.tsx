import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import Articles from "./pages/Articles";
import { DIY } from "./pages/DIY";
import { Leon } from "./pages/Leon";
import { Notes } from "./pages/Notes";
import { About } from "./pages/About";
import Places from "./pages/Places";
import Images from "./pages/Images";
import { ImageDetail } from "./pages/ImageDetail";
import { Publish } from "./pages/Publish";
import { ContentEditorMinimal } from "./components/ContentEditorMinimal";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artikel" element={<Articles />} />
            <Route path="/artikel/:country" element={<Articles />} />
            <Route path="/artikel/diy" element={<DIY />} />
            <Route path="/artikel/diy/:category" element={<DIY />} />
            <Route path="/artikel/leon" element={<Leon />} />
            <Route path="/plaetze" element={<Places />} />
            <Route path="/plaetze/:country" element={<Places />} />
            <Route path="/bilder" element={<Images />} />
            <Route path="/bilder/:country" element={<Images />} />
            <Route path="/bilder/natur/:category" element={<Images />} />
            <Route path="/bild/:nip19" element={<ImageDetail />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:country" element={<Notes />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/veroeffentlichen" element={<Publish />} />
            <Route path="/veroeffentlichen/modern" element={<ContentEditorMinimal />} />
            <Route path="/:nip19" element={<NIP19Page />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;