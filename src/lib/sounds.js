let _ctx = null
function ctx() {
  if (_ctx) return _ctx
  try { _ctx = new (window.AudioContext || window.webkitAudioContext)() } catch {}
  return _ctx
}

function tone(freq, when = 0, duration = 0.15, type = 'sine', vol = 0.08) {
  const c = ctx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain); gain.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + when
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function playProgress() {
  tone(523.25, 0,   0.13, 'sine', 0.08)  // C5
  tone(659.25, 0.08, 0.13, 'sine', 0.08) // E5
  tone(783.99, 0.16, 0.22, 'sine', 0.1)  // G5
}

export function playCelebration() {
  const arp = [523.25, 659.25, 783.99, 1046.50, 1318.51]
  arp.forEach((n, i) => tone(n, i * 0.09, 0.22, 'triangle', 0.11))
  // Chord
  ;[523.25, 659.25, 783.99, 1046.50].forEach(n => tone(n, 0.55, 1.0, 'triangle', 0.06))
}

export function playCheck() {
  tone(880, 0, 0.06, 'sine', 0.05)
}
