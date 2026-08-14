import { useEffect, useRef } from 'react';
import { lineParams } from './authLineParams';

const LINE_COUNT = 20;

function reshape(track) {
  const line = track?.firstElementChild;
  if (!line) return;

  const p = lineParams(window.innerWidth, window.innerHeight);

  track.style.top = `${p.top.toFixed(1)}%`;
  track.style.left = `${p.left.toFixed(1)}%`;
  track.style.transform = `rotate(${p.angle.toFixed(1)}deg)`;

  line.style.setProperty('--len', `${p.len.toFixed(0)}px`);
  line.style.setProperty('--travel', `${p.travel.toFixed(0)}%`);
  line.style.setProperty('--thick', `${p.thickness.toFixed(2)}px`);
  line.style.setProperty('--peak', p.peak.toFixed(2));
  line.style.setProperty('--line-rgb', p.rgb);
  line.style.animationDuration = `${p.duration.toFixed(1)}s`;
}

export default function AuthBackground() {
  const tracks = useRef([]);

  useEffect(() => {
    const elements = tracks.current.filter(Boolean);

    elements.forEach((track, i) => {
      reshape(track);
      const line = track.firstElementChild;
      if (line) line.style.animationDelay = `${-(Math.random() * 40).toFixed(1)}s`;
    });

    const onIteration = (event) => reshape(event.currentTarget.parentElement);
    const lines = elements.map(t => t.firstElementChild).filter(Boolean);
    lines.forEach(line => line.addEventListener('animationiteration', onIteration));

    return () => lines.forEach(line => line.removeEventListener('animationiteration', onIteration));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-backdrop absolute inset-0" />

      {Array.from({ length: LINE_COUNT }, (_, i) => (
        <span key={i} ref={(el) => { tracks.current[i] = el; }} className="auth-line-track">
          <span className="auth-line" />
        </span>
      ))}

      <div className="auth-veil absolute inset-0" />
    </div>
  );
}
