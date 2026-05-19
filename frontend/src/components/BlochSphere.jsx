import { useState, useRef, useEffect } from 'react';

export default function BlochSphere({ x = 0, y = 0, z = 1, qubitIndex = 0, magnitude = 1, entangled = false }) {
  const canvasRef = useRef(null);
  
  // Camera angles in radians: theta (azimuth/yaw) and phi (elevation/pitch)
  const [angles, setAngles] = useState({ theta: 0.6, phi: 0.4 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Handle mouse down inside canvas
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasDragged(false);
    const rect = canvasRef.current.getBoundingClientRect();
    dragStart.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Handle dragging to rotate camera
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setHasDragged(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;
    
    const dx = xPos - dragStart.current.x;
    const dy = yPos - dragStart.current.y;
    
    setAngles(prev => ({
      theta: prev.theta + dx * 0.01,
      phi: Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, prev.phi - dy * 0.01))
    }));
    
    dragStart.current = { x: xPos, y: yPos };
  };

  const handleMouseUp = () => {
    if (isDragging && !hasDragged) {
      setIsEnlarged(prev => !prev);
    }
    setIsDragging(false);
  };

  // Draw 3D Bloch Sphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.4; // Dynamic Sphere Radius

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Coordinate translation: Qiskit coordinates vs standard Bloch projection
    // In Bloch Sphere: 
    // Z is UP (pointing to |0>)
    // X is FORWARD (pointing to |+>)
    // Y is RIGHT (pointing to |i+>)
    
    const project = (x3d, y3d, z3d) => {
      // yaw/azimuth rotation around Z-axis (theta)
      // pitch/elevation rotation around X-axis (phi)
      
      // Let's perform rotations:
      // First, rotate around Z-axis (azimuth)
      const cosT = Math.cos(angles.theta);
      const sinT = Math.sin(angles.theta);
      const rx = x3d * cosT - y3d * sinT;
      const ry = x3d * sinT + y3d * cosT;
      
      // Second, rotate around X-axis (elevation)
      const cosP = Math.cos(angles.phi);
      const sinP = Math.sin(angles.phi);
      const rz = z3d * cosP - ry * sinP;
      const r_y = z3d * sinP + ry * cosP; // Depth coordinate
      
      // Map to orthographic projection screen coordinates
      return {
        x: cx + rx * R,
        y: cy - rz * R, // Invert Y for screen space
        depth: r_y // depth (positive is closer to camera)
      };
    };

    // Draw grid/meridians (equator, primes)
    const drawEquator = () => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * Math.abs(Math.sin(angles.phi)), 0, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawVerticalMeridian = () => {
      ctx.beginPath();
      // Draw ellipse representing vertical meridian
      ctx.ellipse(cx, cy, R * Math.abs(Math.cos(angles.theta)), R, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw outer sphere border
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = entangled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill semi-transparent sphere globe backing
    const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R);
    if (entangled) {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.04)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    } else {
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.02)');
      grad.addColorStop(1, 'rgba(157, 78, 221, 0.08)');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Render grid lines
    drawEquator();
    drawVerticalMeridian();

    // Draw Axes Vectors
    const pCenter = { x: cx, y: cy };
    const pX = project(1.2, 0, 0); // +X (forward)
    const pY = project(0, 1.2, 0); // +Y (right)
    const pZ = project(0, 0, 1.2); // +Z (up)
    const pZ_neg = project(0, 0, -1.2); // -Z (down)

    // Helper to draw axis
    const drawAxis = (pEnd, label, labelColor, color = 'rgba(255, 255, 255, 0.25)') => {
      ctx.beginPath();
      ctx.moveTo(pCenter.x, pCenter.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Axis labels
      const fontSize = isEnlarged ? 16 : 10;
      const xOffset = isEnlarged ? 8 : 4;
      const yOffset = isEnlarged ? 18 : 12;
      ctx.font = `bold ${fontSize}px 'Fira Code', monospace`;
      ctx.fillStyle = labelColor;
      ctx.fillText(label, pEnd.x - xOffset, pEnd.y + (pEnd.y > cy ? yOffset : -xOffset));
    };

    // Draw axes
    drawAxis(pX, '|+>', 'rgba(0, 242, 254, 0.7)', 'rgba(0, 242, 254, 0.15)'); // X: cyan
    drawAxis(pY, '|i+>', 'rgba(255, 0, 127, 0.7)', 'rgba(255, 0, 127, 0.15)'); // Y: pink
    drawAxis(pZ, '|0>', 'rgba(157, 78, 221, 0.9)', 'rgba(157, 78, 221, 0.3)'); // Z: purple
    drawAxis(pZ_neg, '|1>', 'rgba(157, 78, 221, 0.9)', 'rgba(157, 78, 221, 0.15)'); // -Z

    // Compute state vector projection coordinates
    const pState = project(x, y, z);
    
    // Draw projection lines onto equatorial plane (X-Y)
    const pProjXY = project(x, y, 0);
    ctx.beginPath();
    ctx.moveTo(pState.x, pState.y);
    ctx.lineTo(pProjXY.x, pProjXY.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    
    // Line from center to X-Y projection point
    ctx.beginPath();
    ctx.moveTo(pCenter.x, pCenter.y);
    ctx.lineTo(pProjXY.x, pProjXY.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the State Vector |psi> itself
    ctx.beginPath();
    ctx.moveTo(pCenter.x, pCenter.y);
    ctx.lineTo(pState.x, pState.y);
    // Glowing gold/yellow state vector
    ctx.strokeStyle = entangled ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = entangled ? 4 : 8;
    ctx.shadowColor = entangled ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)';
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw node at state vector tip
    ctx.beginPath();
    ctx.arc(pState.x, pState.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = entangled ? '#ef4444' : '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center pivot node
    ctx.beginPath();
    ctx.arc(pCenter.x, pCenter.y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

  }, [x, y, z, angles, magnitude, entangled, isEnlarged]);

  const size = isEnlarged ? 460 : 210;

  return (
    <>
      {isEnlarged && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, backdropFilter: 'blur(4px)' }} 
            onClick={() => setIsEnlarged(false)} 
          />
          {/* Placeholder to prevent layout shift */}
          <div style={{ width: 210, height: 260 }} />
        </>
      )}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '8px',
        zIndex: isEnlarged ? 9999 : 1,
        position: isEnlarged ? 'fixed' : 'relative',
        top: isEnlarged ? '50%' : 'auto',
        left: isEnlarged ? '50%' : 'auto',
        transform: isEnlarged ? 'translate(-50%, -50%)' : 'none',
      }}>
        <div 
          style={{ 
            position: 'relative', 
            cursor: isDragging ? 'grabbing' : isEnlarged ? 'zoom-out' : 'zoom-in',
            background: isEnlarged ? '#0a0a0f' : 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            border: isEnlarged ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: isEnlarged ? '0 0 40px rgba(0, 242, 254, 0.15)' : 'inset 0 4px 10px rgba(0,0,0,0.5)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isEnlarged && (
            <div style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
              Drag to Rotate • Click to Close
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            style={{ display: 'block' }}
          />
          
          {/* Entangled overlay text */}
          {entangled && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.65rem',
              padding: '4px 8px',
              borderRadius: '6px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)'
            }}>
              ENTANGLED (MIXED STATE)
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: isEnlarged ? 'rgba(0,0,0,0.6)' : 'transparent', padding: isEnlarged ? '12px 24px' : '0', borderRadius: '12px', border: isEnlarged ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <div style={{ fontSize: isEnlarged ? '1rem' : '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Qubit {qubitIndex}
          </div>
          <div style={{ fontSize: isEnlarged ? '0.8rem' : '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            x: {x.toFixed(2)}, y: {y.toFixed(2)}, z: {z.toFixed(2)}
          </div>
        </div>
      </div>
    </>
  );
}
