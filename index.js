import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const alphabet = {
  'a': [[0,1], [0.5,0], [1,1], [0.2,0.6], [0.8,0.6]],
  'b': [[0,0], [0,1], [0.8,0.8], [0,0.5], [0.8,0.2], [0,0]],
  'c': [[1,0.2], [0.5,0], [0,0.5], [0.5,1], [1,0.8]],
  'd': [[0,0], [0,1], [0.8,0.5], [0,0]],
  'e': [[1,0], [0,0], [0,1], [1,1], [0,0.5], [0.7,0.5]],
  'f': [[1,0], [0,0], [0,1], [0,0.5], [0.7,0.5]],
  'g': [[1,0.2], [0.5,0], [0,0.5], [0.5,1], [1,0.8], [1,0.5], [0.6,0.5]],
  'h': [[0,0], [0,1], [0,0.5], [1,0.5], [1,0], [1,1]],
  'i': [[0.5,0], [0.5,1]],
  'j': [[1,0], [1,0.8], [0.5,1], [0,0.8]],
  'k': [[0,0], [0,1], [0,0.5], [0.8,0], [0,0.5], [0.8,1]],
  'l': [[0,0], [0,1], [1,1]],
  'm': [[0,1], [0,0], [0.5,0.5], [1,0], [1,1]],
  'n': [[0,1], [0,0], [1,1], [1,0]],
  'o': [[0.5,0], [1,0.5], [0.5,1], [0,0.5], [0.5,0]],
  'p': [[0,1], [0,0], [0.8,0.25], [0,0.5]],
  'q': [[0.5,0], [1,0.5], [0.5,1], [0,0.5], [0.5,0], [0.7,0.7], [1,1]],
  'r': [[0,1], [0,0], [0.8,0.25], [0,0.5], [1,1]],
  's': [[1,0.2], [0,0.2], [1,0.8], [0,0.8]],
  't': [[0,0], [1,0], [0.5,0], [0.5,1]],
  'u': [[0,0], [0,0.8], [0.5,1], [1,0.8], [1,0]],
  'v': [[0,0], [0.5,1], [1,0]],
  'w': [[0,0], [0.2,1], [0.5,0.5], [0.8,1], [1,0]],
  'x': [[0,0], [1,1], [0.5,0.5], [1,0], [0,1]],
  'y': [[0,0], [0.5,0.5], [1,0], [0.5,0.5], [0.5,1]],
  'z': [[0,0], [1,0], [0,1], [1,1]],
  ' ': []
};

const AntSVG = ({ legL1, legL2, legL3, legR1, legR2, legR3 }) => (
  <svg id="ant" viewBox="0 0 40 40" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
    <circle style={{ fill: '#111111' }} cx="20" cy="10" r="2.5" />
    <ellipse style={{ fill: '#111111' }} cx="20" cy="17" rx="3" ry="4" />
    <ellipse style={{ fill: '#111111' }} cx="20" cy="28" rx="4" ry="6" />
    <path d={legL1} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
    <path d={legL2} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
    <path d={legL3} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
    <path d={legR1} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
    <path d={legR2} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
    <path d={legR3} style={{ stroke: '#111111', strokeWidth: '1px', fill: 'none' }} />
  </svg>
);

const HomePage = () => {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [velocity, setVelocity] = useState('0.00 m/s');
  const [ink, setInk] = useState('100%');
  const [charCount, setCharCount] = useState('0/20');
  const [antTransform, setAntTransform] = useState('translate(0px, 0px) rotate(0rad)');
  const [legs, setLegs] = useState({
    l1: 'M17,15 L10,12',
    l2: 'M17,17 L8,17',
    l3: 'M17,19 L10,24',
    r1: 'M23,15 L30,12',
    r2: 'M23,17 L32,17',
    r3: 'M23,19 L30,24',
  });

  const stateRef = useRef({
    targetPath: [],
    currentPos: { x: window.innerWidth / 4, y: window.innerHeight / 2 },
    angle: 0,
    trail: [],
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const animFrameRef = useRef(null);
  const autoTypedRef = useRef(false);

  function generatePath(text, height) {
    const newPath = [];
    let startX = 100;
    let startY = height / 2 - 50;
    const size = 100;
    const spacing = 40;
    text.toLowerCase().split('').forEach(char => {
      const pts = alphabet[char] || [];
      pts.forEach(p => {
        newPath.push({ x: startX + p[0] * size, y: startY + p[1] * size });
      });
      startX += size + spacing;
    });
    return newPath;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    function resize() {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = state.width * window.devicePixelRatio;
      canvas.height = state.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    window.addEventListener('resize', resize);
    resize();

    function animate() {
      const { width, height, trail, currentPos } = state;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0,0,0,0.02)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(17,17,17,0.8)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      if (state.targetPath.length > 0) {
        const target = state.targetPath[0];
        const dx = target.x - currentPos.x;
        const dy = target.y - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          state.targetPath.shift();
        } else {
          const speed = 4;
          const vx = (dx / dist) * speed;
          const vy = (dy / dist) * speed;
          currentPos.x += vx;
          currentPos.y += vy;
          state.angle = Math.atan2(vy, vx) + Math.PI / 2;
          setVelocity(`${(speed + Math.random() * 0.2).toFixed(2)} m/s`);
          trail.push({ x: currentPos.x, y: currentPos.y });
          if (trail.length > 2000) trail.shift();
        }
      } else {
        setVelocity('0.00 m/s');
      }

      setAntTransform(`translate(${currentPos.x - 20}px, ${currentPos.y - 20}px) rotate(${state.angle}rad)`);

      const time = Date.now() * 0.01;
      const legAmplitude = state.targetPath.length > 0 ? 3 : 0.5;

      setLegs({
        l1: `M17,15 L${10 + Math.sin(time) * legAmplitude},${12 + Math.cos(time) * legAmplitude}`,
        r1: `M23,15 L${30 + Math.cos(time) * legAmplitude},${12 + Math.sin(time) * legAmplitude}`,
        l2: `M17,17 L${8 + Math.sin(time + 1) * legAmplitude},${17 + Math.cos(time + 1) * legAmplitude}`,
        r2: `M23,17 L${32 + Math.cos(time + 1) * legAmplitude},${17 + Math.sin(time + 1) * legAmplitude}`,
        l3: `M17,19 L${10 + Math.sin(time + 2) * legAmplitude},${24 + Math.cos(time + 2) * legAmplitude}`,
        r3: `M23,19 L${30 + Math.cos(time + 2) * legAmplitude},${24 + Math.sin(time + 2) * legAmplitude}`,
      });

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!autoTypedRef.current && inputValue === '') {
        autoTypedRef.current = true;
        const welcome = 'formica';
        let i = 0;
        const type = () => {
          if (i < welcome.length) {
            const newVal = welcome.slice(0, i + 1);
            setInputValue(newVal);
            const state = stateRef.current;
            state.targetPath = generatePath(newVal, state.height);
            setCharCount(`${newVal.length}/20`);
            setInk(`${Math.max(10, 100 - newVal.length * 4)}%`);
            i++;
            setTimeout(type, 150);
          }
        };
        type();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const state = stateRef.current;
    state.targetPath = generatePath(val, state.height);
    setCharCount(`${val.length}/20`);
    if (state.targetPath.length > 0) {
      setInk(`${Math.max(10, 100 - val.length * 4)}%`);
    } else {
      setInk('100%');
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#111111',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '40px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(to bottom, #ffffff 60%, transparent)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '400px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#999999',
          }}>Sequence Input</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type to initiate..."
            maxLength={20}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '0.5px solid rgba(0,0,0,0.05)',
              fontFamily: 'Inter',
              fontWeight: 100,
              fontSize: '32px',
              color: '#111111',
              outline: 'none',
              padding: '8px 0',
              width: '100%',
              transition: 'border-color 0.4s ease',
            }}
            onFocus={e => { e.target.style.borderBottomColor = '#111111'; }}
            onBlur={e => { e.target.style.borderBottomColor = 'rgba(0,0,0,0.05)'; }}
          />
        </div>

        <div style={{ display: 'flex', gap: '40px', textAlign: 'right' }}>
          {[
            { label: 'Velocity', value: velocity },
            { label: 'Cohesion', value: '98.4%' },
            { label: 'Ink', value: ink },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#999999',
              }}>{item.label}</span>
              <span style={{ fontWeight: 200, fontSize: '14px' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative', cursor: 'crosshair' }}>
        <div style={{
          position: 'absolute',
          pointerEvents: 'none',
          width: '40px',
          height: '40px',
          zIndex: 50,
          transformOrigin: 'center',
          transform: antTransform,
        }}>
          <AntSVG
            legL1={legs.l1}
            legL2={legs.l2}
            legL3={legs.l3}
            legR1={legs.r1}
            legR2={legs.r2}
            legR3={legs.r3}
          />
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </main>

      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.8)',
        border: '0.5px solid rgba(0,0,0,0.05)',
        padding: '12px 24px',
        borderRadius: '100px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          background: '#E59649',
          borderRadius: '50%',
          boxShadow: '0 0 10px #E59649',
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#111111',
        }}>Formica-01 Active</span>
        <div style={{ width: '1px', height: '14px', background: 'rgba(0,0,0,0.05)' }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#999999',
        }}>{charCount}</span>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;400&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      input::placeholder { color: #eee; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
