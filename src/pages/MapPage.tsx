import React from 'react';

export function MapPage() {
  return React.createElement('div', {
    className: 'min-h-screen bg-background',
    children: React.createElement('div', {
      className: 'container mx-auto px-4 py-8',
      children: [
        React.createElement('div', {
          className: 'text-center space-y-4 mb-6',
          children: React.createElement('div', {
            children: '🗺️',
            className: 'text-6xl'
          })
        }),
        React.createElement('h1', {
          className: 'text-3xl font-bold',
          children: 'Reise-Karte'
        }),
        React.createElement('p', {
          className: 'text-muted-foreground',
          children: 'Testseite - MapPage funktioniert!'
        })
      ]
    })
  });
}

export default MapPage;
