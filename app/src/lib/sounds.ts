import { createAudioPlayer } from 'expo-audio';

/**
 * Correct/wrong answer sound effects for the practice quiz (instant-feedback
 * mode only — mock tests intentionally stay silent, since real exams don't
 * beep at you). Players are created once and reused; each play seeks back to
 * the start so rapid-fire answering never gets skipped or overlaps oddly.
 */

const correctPlayer = createAudioPlayer(require('../../assets/sounds/correct.wav'));
const wrongPlayer = createAudioPlayer(require('../../assets/sounds/wrong.wav'));

async function play(player: ReturnType<typeof createAudioPlayer>) {
  try {
    await player.seekTo(0);
    player.play();
  } catch {
    // never let a sound glitch interrupt the quiz
  }
}

export function playCorrectSound() {
  play(correctPlayer);
}

export function playWrongSound() {
  play(wrongPlayer);
}
