import { useEffect, useCallback } from 'react';
import soundManager from '../utils/soundManager';

/**
 * React hook for playing UI sound effects
 * Provides convenient methods for common sound interactions
 */
export const useSound = () => {
  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      await soundManager.initialize();
      await soundManager.resumeContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Add listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const playTick = useCallback(() => {
    // NOTE: removed due to being too spammy
    // soundManager.playSound('tick');
  }, []);

  const playCardPickup = useCallback(() => {
    soundManager.playSound('card-pickup');
  }, []);

  const playCardSlide = useCallback(() => {
    soundManager.playSound('card-slide');
  }, []);

  const playClick = useCallback(() => {
    // NOTE: removed due to being too spammy
    // soundManager.playSound('click');
  }, []);

  const playTransLoad = useCallback(() => {
    soundManager.playSound('trans-load');
  }, []);

  const playTransUnload = useCallback(() => {
    soundManager.playSound('trans-unload');
  }, []);

  const playTransDeveloped = useCallback(() => {
    soundManager.playSound('trans-developed');
  }, []);

  const playTransScanned = useCallback(() => {
    soundManager.playSound('trans-scanned');
  }, []);

  return {
    playTick,
    playCardPickup,
    playCardSlide,
    playClick,
    playTransLoad,
    playTransUnload,
    playTransDeveloped,
    playTransScanned,
  };
};

export default useSound;
