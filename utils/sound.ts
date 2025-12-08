// Simple oscillator synthesizer to avoid external assets
export const playSound = (type: 'soft' | 'alert' | 'finish' | 'beep' | 'double-beep') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'beep') {
    // Single sharp beep (800Hz)
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

  } else if (type === 'double-beep') {
    // Two sharp beeps
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    // First beep
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    
    // Pause
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    
    // Second beep
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

  } else if (type === 'soft') {
    // Soft chime for phase change
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);

  } else if (type === 'alert') {
    // Alert for phase change (Attention needed)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);

  } else if (type === 'finish') {
    // Long finish sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.linearRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  }
};