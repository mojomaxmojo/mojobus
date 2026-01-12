import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy Load alle Seiten außer Home (wird bei Initial Load benötigt)
const Articles = lazy(() => import("./pages/Articles"));
const DIY = lazy(() => import("./pages/DIY"));
const Leon = lazy(() => import("./pages/Leon"));
const RVLife = lazy(() => import("./pages/RVLife"));
const Notes = lazy(() => import("./pages/Notes"));
const About = lazy(() => import("./pages/About"));
const Places = lazy(() => import("./pages/Places"));
const Images = lazy(() => import("./pages/Images"));
const ImageDetail = lazy(() => import("./pages/ImageDetail"));
const Publish = lazy(() => import("./pages/Publish"));
const ContentEditorMinimal = lazy(() => import("./components/ContentEditorMinimal"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NIP19Page = lazy(() => import("./pages/NIP19Page"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading Komponente für Lazy Loaded Pages
function PageLoader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/artikel" element={<Articles />} />
              <Route path="/artikel/:country" element={<Articles />} />
              <Route path="/artikel/diy" element={<DIY />} />
              <Route path="/artikel/diy/:category" element={<DIY />} />
              <Route path="/artikel/leon" element={<Leon />} />
              <Route path="/artikel/rvlife" element={<RVLife />} />
              <Route path="/artikel/rvlife/:category" element={<RVLife />} />
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
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;