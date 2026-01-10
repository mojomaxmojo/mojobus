import { Route } from '@/config/types';

export const ROUTES: Route[] = [
  { path: '/', component: 'Home', title: 'Home', description: 'MojoBus Perpetual Traveler Blog' },
  { path: '/artikel', component: 'Articles', title: 'Artikel', category: 'articles' },
  { path: '/artikel/:country', component: 'Articles', title: 'Artikel aus Land', category: 'articles' },
  { path: '/artikel/diy', component: 'DIY', title: 'DIY Anleitungen', category: 'diy' },
  { path: '/artikel/diy/:category', component: 'DIY', title: 'DIY Kategorie', category: 'diy' },
  { path: '/artikel/leon', component: 'Leon', title: 'Leon Stories', category: 'leon' },
  { path: '/artikel/leon/:category', component: 'Leon', title: 'Leon Kategorie', category: 'leon' },
  { path: '/plaetze', component: 'Places', title: 'Plätze', category: 'places' },
  { path: '/plaetze/:country', component: 'Places', title: 'Plätze in Land', category: 'places' },
  { path: '/bilder', component: 'Images', title: 'Bilder', category: 'media' },
  { path: '/bilder/:country', component: 'Images', title: 'Bilder aus Land', category: 'media' },
  { path: '/notes', component: 'Notes', title: 'Notes', category: 'notes' },
  { path: '/notes/:country', component: 'Notes', title: 'Notes aus Land', category: 'notes' },
  { path: '/about', component: 'About', title: 'About' },
  { path: '/profile', component: 'Profile', title: 'Profil', requiresAuth: true },
  { path: '/settings', component: 'Settings', title: 'Einstellungen', requiresAuth: true },
  { path: '/veroeffentlichen', component: 'Publish', title: 'Veröffentlichen', requiresAuth: true },
  { path: '/:nip19', component: 'NIP19Page', title: 'Nostr Content' },
  { path: '*', component: 'NotFound', title: 'Seite nicht gefunden' }
];

export default ROUTES;