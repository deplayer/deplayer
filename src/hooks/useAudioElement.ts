import { useSyncExternalStore } from 'react'
import PlayerRefService from '../services/PlayerRefService'

const service = PlayerRefService.getInstance()

/**
 * The <audio> element currently playing, re-rendering whenever ReactPlayer
 * swaps it (it is keyed per track). Null for video or before the player mounts.
 */
export const useAudioElement = (): HTMLAudioElement | null =>
  useSyncExternalStore(service.subscribeAudioElement, service.getAudioElement)
