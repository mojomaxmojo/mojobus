import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { YouTubeEmbed, extractYouTubeId } from './YouTubeEmbed';
import { videoConfig } from '@/config/video';

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
  aspectRatio?: string;
}

/**
 * Universal Video Embed Komponente
 * Erkennt automatisch den Video-Typ und wählt den passenden Player
 */
export function VideoEmbed({ 
  url, 
  title,
  className = '',
  aspectRatio = '16/9'
}: VideoEmbedProps) {
  // Prüfen ob es eine YouTube URL ist
  const youtubeId = extractYouTubeId(url);
  
  // Prüfen ob es ein direktes Video ist
  const isDirectVideo = isVideoUrl(url);

  // YouTube Video
  if (youtubeId && videoConfig.autoEmbed.youtube) {
    return (
      <YouTubeEmbed
        videoId={youtubeId}
        title={title}
        className={className}
        aspectRatio={aspectRatio}
      />
    );
  }

  // Direktes Video
  if (isDirectVideo && videoConfig.autoEmbed.direct) {
    return (
      <VideoPlayer
        src={url}
        title={title}
        className={className}
        aspectRatio={aspectRatio}
      />
    );
  }

  // Fallback: Wenn Auto-Embed deaktiviert oder nicht unterstütztes Format
  return (
    <div className={`inline-block ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-2"
      >
        <span className="text-lg">📹</span>
        <span>{title || url}</span>
      </a>
    </div>
  );
}

/**
 * Prüft ob eine URL zu einem direkten Video-File führt
 */
export function isVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Prüfen ob die Endung unterstützt wird
    const extension = pathname.split('.').pop();
    return videoConfig.supportedExtensions.includes(extension || '');
  } catch {
    return false;
  }
}

/**
 * Prüft ob eine URL ein Video enthält (YouTube oder direkt)
 */
export function isVideoContent(url: string): boolean {
  return isVideoUrl(url) || extractYouTubeId(url) !== null;
}