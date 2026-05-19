// Quantum Simulation Engine for ParallelGrid
// Supports N-qubit statevectors (up to 6 qubits recommended for UI responsiveness)
// Implements unitary gate applications, controls, spinning gates, arithmetic gates, QFT, and Bloch/Density tracing.

// --- Complex Number Arithmetic Helpers ---
export const Complex = {
  zero: () => ({ re: 0, im: 0 }),
  one: () => ({ re: 1, im: 0 }),
  create: (re, im = 0) => ({ re, im }),
  add: (c1, c2) => ({ re: c1.re + c2.re, im: c1.im + c2.im }),
  sub: (c1, c2) => ({ re: c1.re - c2.re, im: c1.im - c2.im }),
  mul: (c1, c2) => ({
    re: c1.re * c2.re - c1.im * c2.im,
    im: c1.re * c2.im + c1.im * c2.re
  }),
  conj: (c) => ({ re: c.re, im: -c.im }),
  mag2: (c) => c.re * c.re + c.im * c.im,
  mag: (c) => Math.sqrt(c.re * c.re + c.im * c.im),
  phase: (c) => Math.atan2(c.im, c.re),
  fromPolar: (r, theta) => ({
    re: r * Math.cos(theta),
    im: r * Math.sin(theta)
  })
};

// --- Standard Unitary Matrices ---
const SQRT1_2 = Math.SQRT1_2;
export const Matrices = {
  h: [
    [Complex.create(SQRT1_2), Complex.create(SQRT1_2)],
    [Complex.create(SQRT1_2), Complex.create(-SQRT1_2)]
  ],
  x: [
    [Complex.zero(), Complex.one()],
    [Complex.one(), Complex.zero()]
  ],
  y: [
    [Complex.zero(), Complex.create(0, -1)],
    [Complex.create(0, 1), Complex.zero()]
  ],
  z: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.create(-1)]
  ],
  s: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.create(0, 1)]
  ],
  s_inv: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.create(0, -1)]
  ],
  t: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.create(SQRT1_2, SQRT1_2)]
  ],
  t_inv: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.create(SQRT1_2, -SQRT1_2)]
  ],
  x_12: [
    [Complex.create(SQRT1_2), Complex.create(0, -SQRT1_2)],
    [Complex.create(0, -SQRT1_2), Complex.create(SQRT1_2)]
  ],
  x_12_inv: [
    [Complex.create(SQRT1_2), Complex.create(0, SQRT1_2)],
    [Complex.create(0, SQRT1_2), Complex.create(SQRT1_2)]
  ],
  y_12: [
    [Complex.create(SQRT1_2), Complex.create(-SQRT1_2)],
    [Complex.create(SQRT1_2), Complex.create(SQRT1_2)]
  ],
  y_12_inv: [
    [Complex.create(SQRT1_2), Complex.create(SQRT1_2)],
    [Complex.create(-SQRT1_2), Complex.create(SQRT1_2)]
  ],
  x_14: [
    [Complex.create(Math.cos(Math.PI/8)), Complex.create(0, -Math.sin(Math.PI/8))],
    [Complex.create(0, -Math.sin(Math.PI/8)), Complex.create(Math.cos(Math.PI/8))]
  ],
  x_14_inv: [
    [Complex.create(Math.cos(Math.PI/8)), Complex.create(0, Math.sin(Math.PI/8))],
    [Complex.create(0, Math.sin(Math.PI/8)), Complex.create(Math.cos(Math.PI/8))]
  ],
  y_14: [
    [Complex.create(Math.cos(Math.PI/8)), Complex.create(-Math.sin(Math.PI/8))],
    [Complex.create(Math.sin(Math.PI/8)), Complex.create(Math.cos(Math.PI/8))]
  ],
  y_14_inv: [
    [Complex.create(Math.cos(Math.PI/8)), Complex.create(Math.sin(Math.PI/8))],
    [Complex.create(-Math.sin(Math.PI/8)), Complex.create(Math.cos(Math.PI/8))]
  ],
  // Projections / X-Y Probes
  plus_proj: [
    [Complex.create(0.5), Complex.create(0.5)],
    [Complex.create(0.5), Complex.create(0.5)]
  ],
  minus_proj: [
    [Complex.create(0.5), Complex.create(-0.5)],
    [Complex.create(-0.5), Complex.create(0.5)]
  ],
  i_proj: [
    [Complex.create(0.5), Complex.create(0, -0.5)],
    [Complex.create(0, 0.5), Complex.create(0.5)]
  ],
  minus_i_proj: [
    [Complex.create(0.5), Complex.create(0, 0.5)],
    [Complex.create(0, -0.5), Complex.create(0.5)]
  ],
  // Scalar operators
  scalar_0: [
    [Complex.one(), Complex.zero()],
    [Complex.zero(), Complex.zero()]
  ]
};

// Helper to check if a basis state index meets controls
function checkControls(k, controls) {
  for (const c of controls) {
    const bit = (k >> c.qubit) & 1;
    if (c.type === 'control' && bit !== 1) return false;
    if (c.type === 'anti-control' && bit !== 0) return false;
  }
  return true;
}

// Applies a 1-qubit unitary matrix to qubit q in statevector psi, conditionally
function applyOneQubitGate(psi, q, matrix, controls) {
  const N = psi.length;
  const psiNew = [...psi];
  
  for (let k = 0; k < N; k++) {
    // Only apply if the q-th bit is 0, so we can process pairs (k, k + 2^q)
    if (((k >> q) & 1) === 0) {
      const k0 = k;
      const k1 = k + (1 << q);
      
      const meetsC0 = checkControls(k0, controls);
      const meetsC1 = checkControls(k1, controls);
      
      if (meetsC0 || meetsC1) {
        const val0 = psi[k0];
        const val1 = psi[k1];
        
        // psi'[k0] = u00*psi[k0] + u01*psi[k1]
        psiNew[k0] = Complex.add(
          Complex.mul(matrix[0][0], val0),
          Complex.mul(matrix[0][1], val1)
        );
        // psi'[k1] = u10*psi[k0] + u11*psi[k1]
        psiNew[k1] = Complex.add(
          Complex.mul(matrix[1][0], val0),
          Complex.mul(matrix[1][1], val1)
        );
      }
    }
  }
  return psiNew;
}

// Simulates the entire quantum circuit, returning intermediate states and final results
export function simulateQuantumCircuit(numQubits, gates, timeVal = 0, classicalInputs = { A: 0, B: 0, R: 3 }) {
  const numStates = 1 << numQubits;
  let state = Array.from({ length: numStates }, (_, i) => 
    i === 0 ? Complex.one() : Complex.zero()
  );
  
  // Track statevector after each column step (0 to 7)
  const intermediateStates = [];
  
  for (let col = 0; col < 8; col++) {
    // 1. Gather all gates in this column
    const colGates = gates.filter(g => g.step === col);
    
    // 2. Identify controls and displays
    const controls = [];
    const targets = [];
    const displays = [];
    
    for (const g of colGates) {
      if (g.gate === 'control' || g.gate === '●') {
        controls.push({ qubit: g.targets[0], type: 'control' });
      } else if (g.gate === 'anti-control' || g.gate === '○') {
        controls.push({ qubit: g.targets[0], type: 'anti-control' });
      } else if (['density', 'bloch', 'chance', 'amps'].includes(g.gate.toLowerCase())) {
        displays.push(g);
      } else {
        targets.push(g);
      }
    }
    
    // 3. Apply target gates in this column
    let colState = [...state];
    
    for (const gate of targets) {
      const type = gate.gate.toLowerCase();
      const q = gate.targets[0];
      
      if (Matrices[type]) {
        // Standard single qubit gate
        colState = applyOneQubitGate(colState, q, Matrices[type], controls);
      } else if (type === 'swap') {
        // SWAP gate between target 0 and target 1
        const q1 = gate.targets[0];
        const q2 = gate.targets[1] !== undefined ? gate.targets[1] : (q1 + 1) % numQubits;
        
        const nextState = [...colState];
        for (let k = 0; k < numStates; k++) {
          if (checkControls(k, controls)) {
            const bit1 = (k >> q1) & 1;
            const bit2 = (k >> q2) & 1;
            if (bit1 !== bit2) {
              const kSwapped = k ^ (1 << q1) ^ (1 << q2);
              if (k < kSwapped) {
                const temp = nextState[k];
                nextState[k] = nextState[kSwapped];
                nextState[kSwapped] = temp;
              }
            }
          }
        }
        colState = nextState;
      } else if (['rx', 'ry', 'rz', 'r_ft', 'rx_ft', 'ry_ft', 'rz_ft', 'z_t', 'z_t_inv', 'y_t', 'y_t_inv', 'x_t', 'x_t_inv'].includes(type)) {
        // Rotations / Spinning / Formulaic
        let theta = 0;
        if (type === 'rx' || type === 'ry' || type === 'rz') {
          theta = parseFloat(gate.params?.theta) || (Math.PI / 2);
        } else if (type.includes('_t')) {
          // Spinning gates based on timeVal (0 to 1)
          const multiplier = type.includes('_t_inv') ? -2 : 2;
          theta = multiplier * Math.PI * timeVal;
        } else if (type.includes('_ft')) {
          // Formulaic - time animated oscillatory phase f(t)
          theta = Math.sin(2 * Math.PI * timeVal) * Math.PI;
        }
        
        let rotMat = [];
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        
        if (type.includes('rx') || type.includes('x_t')) {
          rotMat = [
            [Complex.create(cos), Complex.create(0, -sin)],
            [Complex.create(0, -sin), Complex.create(cos)]
          ];
        } else if (type.includes('ry') || type.includes('y_t')) {
          rotMat = [
            [Complex.create(cos), Complex.create(-sin)],
            [Complex.create(sin), Complex.create(cos)]
          ];
        } else {
          // Rz / Z_t
          rotMat = [
            [Complex.create(Math.cos(-theta/2), Math.sin(-theta/2)), Complex.zero()],
            [Complex.zero(), Complex.create(Math.cos(theta/2), Math.sin(theta/2))]
          ];
        }
        
        colState = applyOneQubitGate(colState, q, rotMat, controls);
      } else if (['add_1', 'sub_1', 'add_a', 'sub_a', 'add_ab', 'mul_a', 'div_a'].includes(type)) {
        // Quantum Arithmetic!
        // Treats qubits from position q down to numQubits-1 as a binary register of size M
        const startQ = q;
        const M = numQubits - startQ;
        const regMask = (1 << M) - 1;
        
        const nextState = Array.from({ length: numStates }, () => Complex.zero());
        const A_val = classicalInputs.A;
        const B_val = classicalInputs.B;
        
        for (let k = 0; k < numStates; k++) {
          if (checkControls(k, controls)) {
            const v = (k >> startQ) & regMask;
            let vNew = v;
            
            if (type === 'add_1') vNew = (v + 1) & regMask;
            else if (type === 'sub_1') vNew = (v - 1 + (1 << M)) & regMask;
            else if (type === 'add_a') vNew = (v + A_val) & regMask;
            else if (type === 'sub_a') vNew = (v - A_val + (1 << M)) & regMask;
            else if (type === 'add_ab') vNew = (v + A_val * B_val) & regMask;
            else if (type === 'mul_a') vNew = (v * (A_val | 1)) & regMask; // use odd multiplier to keep it reversible
            else if (type === 'div_a') vNew = Math.floor(v / (A_val || 1)) & regMask;
            
            // Map k -> kNew (replace register bits)
            const kNew = (k & ~(regMask << startQ)) | (vNew << startQ);
            nextState[kNew] = colState[k];
          } else {
            nextState[k] = colState[k];
          }
        }
        colState = nextState;
      } else if (type.startsWith('compare_')) {
        // Compare Register conditions (e.g. A < B)
        // If true, we toggle (Pauli-X) the target qubit q
        const cond = type.split('compare_')[1]; // 'lt', 'gt', 'le', 'ge', 'eq', 'ne'
        const A_val = classicalInputs.A;
        const B_val = classicalInputs.B;
        
        let comparisonHolds = false;
        if (cond === 'lt') comparisonHolds = A_val < B_val;
        else if (cond === 'gt') comparisonHolds = A_val > B_val;
        else if (cond === 'le') comparisonHolds = A_val <= B_val;
        else if (cond === 'ge') comparisonHolds = A_val >= B_val;
        else if (cond === 'eq') comparisonHolds = A_val === B_val;
        else if (cond === 'ne') comparisonHolds = A_val !== B_val;
        
        if (comparisonHolds) {
          colState = applyOneQubitGate(colState, q, Matrices.x, controls);
        }
      } else if (['qft', 'qft_inv'].includes(type)) {
        // Quantum Fourier Transform on register starting at q
        const startQ = q;
        const M = numQubits - startQ;
        const regStates = 1 << M;
        const nextState = [...colState];
        
        // Loop over non-register prefix states
        for (let prefix = 0; prefix < (1 << startQ); prefix++) {
          if (checkControls(prefix << startQ, controls)) {
            // Extract register amplitudes
            const regAmps = [];
            for (let r = 0; r < regStates; r++) {
              regAmps.push(colState[prefix | (r << startQ)]);
            }
            
            // Apply QFT multiplication
            const qftAmps = [];
            const omegaBase = (type === 'qft' ? 2 : -2) * Math.PI / regStates;
            
            for (let j = 0; j < regStates; j++) {
              let sum = Complex.zero();
              for (let k = 0; k < regStates; k++) {
                const angle = omegaBase * j * k;
                const factor = Complex.fromPolar(1 / Math.sqrt(regStates), angle);
                sum = Complex.add(sum, Complex.mul(factor, regAmps[k]));
              }
              qftAmps.push(sum);
            }
            
            // Write QFT amplitudes back
            for (let r = 0; r < regStates; r++) {
              nextState[prefix | (r << startQ)] = qftAmps[r];
            }
          }
        }
        colState = nextState;
      } else if (['scalar_minus', 'scalar_i', 'scalar_minus_i', 'scalar_sqrt_i', 'scalar_sqrt_minus_i'].includes(type)) {
        // Scalar multipliers applied if qubit q is in |1>
        let factor = Complex.one();
        if (type === 'scalar_minus') factor = Complex.create(-1);
        else if (type === 'scalar_i') factor = Complex.create(0, 1);
        else if (type === 'scalar_minus_i') factor = Complex.create(0, -1);
        else if (type === 'scalar_sqrt_i') factor = Complex.create(SQRT1_2, SQRT1_2);
        else if (type === 'scalar_sqrt_minus_i') factor = Complex.create(SQRT1_2, -SQRT1_2);
        
        const nextState = [...colState];
        for (let k = 0; k < numStates; k++) {
          if (checkControls(k, controls) && ((k >> q) & 1) === 1) {
            nextState[k] = Complex.mul(nextState[k], factor);
          }
        }
        colState = nextState;
      }
    }
    
    // Update active simulation statevector
    state = colState;
    intermediateStates.push({
      step: col,
      statevector: [...state],
      displays: displays.map(d => ({
        gate: d.gate,
        qubit: d.targets[0]
      }))
    });
  }
  
  // --- Format Final Outputs ---
  const statevectorResults = state.map((val, i) => {
    const label = formatBinary(i, numQubits);
    const prob = Complex.mag2(val);
    const phaseRad = Complex.phase(val);
    
    return {
      label: `|${label}>`,
      real: roundTo(val.re, 5),
      imag: roundTo(val.im, 5),
      probability: roundTo(prob, 5),
      phase_rad: roundTo(phaseRad, 5),
      phase_deg: roundTo(phaseRad * (180 / Math.PI), 1)
    };
  });
  
  // Compute Bloch coordinates for each qubit in the FINAL state
  const blochVectors = Array.from({ length: numQubits }, (_, q) => {
    // Tracing out other qubits:
    // rho00 = sum_{k: bit q is 0} |psi[k]|^2
    // rho11 = sum_{k: bit q is 1} |psi[k]|^2
    // rho01 = sum_{k: bit q is 0} psi[k] * conj(psi[k + 2^q])
    let rho00 = 0;
    let rho11 = 0;
    let rho01 = Complex.zero();
    
    for (let k = 0; k < numStates; k++) {
      const bit = (k >> q) & 1;
      const mag2 = Complex.mag2(state[k]);
      if (bit === 0) {
        rho00 += mag2;
        const k1 = k + (1 << q);
        const term = Complex.mul(state[k], Complex.conj(state[k1]));
        rho01 = Complex.add(rho01, term);
      } else {
        rho11 += mag2;
      }
    }
    
    const x = 2 * rho01.re;
    const y = -2 * rho01.im;
    const z = rho00 - rho11;
    const mag = Math.sqrt(x*x + y*y + z*z);
    
    return {
      qubit: q,
      x: roundTo(x, 5),
      y: roundTo(y, 5),
      z: roundTo(z, 5),
      magnitude: roundTo(mag, 5),
      entangled: mag < 0.95
    };
  });
  
  return {
    num_qubits: numQubits,
    success: true,
    statevector: statevectorResults,
    bloch_vectors: blochVectors,
    intermediate_states: intermediateStates
  };
}

// Helpers
function formatBinary(num, length) {
  let str = num.toString(2);
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

function roundTo(num, places) {
  const p = Math.pow(10, places);
  return Math.round((num + Number.EPSILON) * p) / p;
}
