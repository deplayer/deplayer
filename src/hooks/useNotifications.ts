import { useEffect, useCallback } from 'react';
import type Media from '../entities/Media';

interface UseNotificationsProps {
  currentTrack: Media | null;
  notificationsEnabled: boolean;
}

export function useNotifications({ currentTrack, notificationsEnabled }: UseNotificationsProps) {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }, []);

  const showTrackNotification = useCallback((track: Media) => {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !notificationsEnabled) {
      return;
    }

    const options: NotificationOptions = {
      body: `${track.artistName || 'Unknown Artist'} - ${track.albumName || 'Unknown Album'}`,
      icon: track.cover?.thumbnailUrl || track.cover?.fullUrl,
      silent: true, // Don't play notification sound since music is playing
      tag: 'now-playing', // Replace existing notification instead of stacking
      requireInteraction: false, // Auto-close after default timeout
    };

    new Notification(track.title || 'Unknown Title', options);
  }, [notificationsEnabled]);

  const showErrorNotification = useCallback((error: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !notificationsEnabled) {
      return;
    }

    const options: NotificationOptions = {
      body: error,
      icon: '/icons/error.png', // You'll need to add this icon to your public assets
      tag: 'player-error',
      requireInteraction: true, // Keep error notifications visible until user dismisses
    };

    new Notification('Playback Error', options);
  }, [notificationsEnabled]);

  // Request notification permission when the hook is first used
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Show notification when track changes
  useEffect(() => {
    if (currentTrack) {
      showTrackNotification(currentTrack);
    }
  }, [currentTrack, showTrackNotification]);

  return {
    showTrackNotification,
    showErrorNotification,
  };
} 