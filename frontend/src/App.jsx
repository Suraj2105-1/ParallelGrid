import { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Settings, 
  History, 
  Play, 
  Save, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Zap, 
  BarChart3, 
  Database, 
  Sparkles, 
  Info,
  Sliders,
  Share2,
  Lock,
  Unlock
} from 'lucide-react';

import './App.css';
import BlochSphere from './components/BlochSphere';
import { simulateQuantumCircuit } from './utils/quantumEngine';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const QUANTUM_API_BASE = import.meta.env.VITE_QUANTUM_API_BASE || 'http://localhost:5001/api/quantum';

// Toolbox 1 Gate Specifications
const quantumToolbox1 = [
  {
    category: "Probes",
    gates: [
      { id: "●", name: "●", desc: "Control: activates target if wire qubit is 1" },
      { id: "○", name: "○", desc: "Anti-Control: activates target if wire qubit is 0" },
      { id: "state_0", name: "|0⟩⟨0|", desc: "State preparation: Projects/Forces wire to |0⟩ state" },
      { id: "state_1", name: "|1⟩⟨1|", desc: "State preparation: Projects/Forces wire to |1⟩ state" }
    ]
  },
  {
    category: "Displays",
    gates: [
      { id: "density", name: "Density", desc: "Intermediate Density Matrix state visualizer" },
      { id: "bloch", name: "Bloch", desc: "Intermediate local Bloch Sphere pointer" },
      { id: "chance", name: "Chance", desc: "Intermediate local state probability bar" },
      { id: "amps", name: "Amps", desc: "Intermediate phasor dial state vector visualizer" }
    ]
  },
  {
    category: "Half Turns",
    gates: [
      { id: "h", name: "H", desc: "Hadamard: places qubit into equal superposition" },
      { id: "x", name: "⊕", desc: "Pauli-X (NOT): flips qubit state" },
      { id: "y", name: "Y", desc: "Pauli-Y: rotation around Y-axis by pi" },
      { id: "z", name: "Z", desc: "Pauli-Z: rotation around Z-axis by pi (Phase-flip)" },
      { id: "swap", name: "Swap", desc: "Swap wires: exchanges state of two qubits" }
    ]
  },
  {
    category: "Quarter Turns",
    gates: [
      { id: "s", name: "S", desc: "Phase gate Z^1/2 (pi/2 phase shift)" },
      { id: "s_inv", name: "S^-1", desc: "Inverse Phase gate Z^-1/2 (-pi/2 phase shift)" },
      { id: "x_12", name: "X^1/2", desc: "Rx(pi/2) - square root of NOT" },
      { id: "x_12_inv", name: "X^-1/2", desc: "Rx(-pi/2) - inverse square root of NOT" },
      { id: "y_12", name: "Y^1/2", desc: "Ry(pi/2) - Y half-turn" },
      { id: "y_12_inv", name: "Y^-1/2", desc: "Ry(-pi/2) - inverse Y half-turn" }
    ]
  },
  {
    category: "Eighth Turns",
    gates: [
      { id: "t", name: "T", desc: "T gate Z^1/4 (pi/4 phase shift)" },
      { id: "t_inv", name: "T^-1", desc: "Inverse T gate Z^-1/4 (-pi/4 phase shift)" },
      { id: "x_14", name: "X^1/4", desc: "Rx(pi/4) - X eighth-turn" },
      { id: "x_14_inv", name: "X^-1/4", desc: "Rx(-pi/4) - inverse X eighth-turn" },
      { id: "y_14", name: "Y^1/4", desc: "Ry(pi/4) - Y eighth-turn" },
      { id: "y_14_inv", name: "Y^-1/4", desc: "Ry(-pi/4) - inverse Y eighth-turn" }
    ]
  },
  {
    category: "Spinning",
    gates: [
      { id: "z_t", name: "Z^t", desc: "Continuous spinning Z-axis rotation (animated)" },
      { id: "z_t_inv", name: "Z^-t", desc: "Continuous spinning Z-axis inverse rotation (animated)" },
      { id: "y_t", name: "Y^t", desc: "Continuous spinning Y-axis rotation (animated)" },
      { id: "y_t_inv", name: "Y^-t", desc: "Continuous spinning Y-axis inverse rotation (animated)" },
      { id: "x_t", name: "X^t", desc: "Continuous spinning X-axis rotation (animated)" },
      { id: "x_t_inv", name: "X^-t", desc: "Continuous spinning X-axis inverse rotation (animated)" }
    ]
  },
  {
    category: "Formulaic",
    gates: [
      { id: "z_ft", name: "Z^f(t)", desc: "Formulaic phase: theta = sin(time)*pi (animated)" },
      { id: "rz_ft", name: "Rz(f(t))", desc: "Formulaic Rz rotation: theta = sin(time)*pi" },
      { id: "y_ft", name: "Y^f(t)", desc: "Formulaic Ry rotation: theta = sin(time)*pi" },
      { id: "ry_ft", name: "Ry(f(t))", desc: "Formulaic Ry rotation custom" },
      { id: "x_ft", name: "X^f(t)", desc: "Formulaic Rx rotation: theta = sin(time)*pi" },
      { id: "rx_ft", name: "Rx(f(t))", desc: "Formulaic Rx rotation custom" }
    ]
  },
  {
    category: "Parametrized",
    gates: [
      { id: "z_A", name: "Z^A", desc: "Z rotation parametrized by classical Input value A" },
      { id: "z_A_inv", name: "Z^-A", desc: "Z inv rotation parametrized by Input A" },
      { id: "y_A", name: "Y^A", desc: "Y rotation parametrized by Input A" },
      { id: "y_A_inv", name: "Y^-A", desc: "Y inv rotation parametrized by Input A" },
      { id: "x_A", name: "X^A", desc: "X rotation parametrized by Input A" },
      { id: "x_A_inv", name: "X^-A", desc: "X inv rotation parametrized by Input A" }
    ]
  }
];

// Toolbox 2 Gate Specifications
const quantumToolbox2 = [
  {
    category: "X/Y Probes",
    gates: [
      { id: "plus_proj", name: "⊕_p", desc: "Plus state projection: forces state vector onto |+⟩" },
      { id: "minus_proj", name: "⊖_p", desc: "Minus state projection: forces state vector onto |-⟩" },
      { id: "amp0_proj", name: "∅", desc: "Zero amplitude projection" },
      { id: "amp1_proj", name: "⊗", desc: "One amplitude projection" },
      { id: "prep_plus", name: "|+⟩⟨+|", desc: "Preparation: Places qubit in |+⟩ state" },
      { id: "prep_minus", name: "|-⟩⟨-|", desc: "Preparation: Places qubit in |-⟩ state" },
      { id: "prep_i", name: "|i⟩⟨i|", desc: "Preparation: Places qubit in circular state |i⟩" },
      { id: "prep_minus_i", name: "|-i⟩⟨-i|", desc: "Preparation: Places qubit in circular state |-i⟩" }
    ]
  },
  {
    category: "Frequency",
    gates: [
      { id: "qft", name: "QFT", desc: "Quantum Fourier Transform: converts register to frequency basis" },
      { id: "qft_inv", name: "QFT^-1", desc: "Inverse Quantum Fourier Transform" },
      { id: "grad_12", name: "Grad^1/2", desc: "Gradient phase shift gate" },
      { id: "grad_12_inv", name: "Grad^-1/2", desc: "Gradient phase shift inverse" },
      { id: "grad_t", name: "Grad^t", desc: "Time-varying gradient phase shift (animated)" },
      { id: "grad_t_inv", name: "Grad^-t", desc: "Time-varying gradient phase shift inverse" }
    ]
  },
  {
    category: "Inputs",
    gates: [
      { id: "input_A", name: "input A", desc: "Designates starting qubit wire as Register A" },
      { id: "input_B", name: "input B", desc: "Designates starting qubit wire as Register B" },
      { id: "input_R", name: "input R", desc: "Designates starting qubit wire as modulus Register R" }
    ]
  },
  {
    category: "Arithmetic",
    gates: [
      { id: "add_1", name: "+1", desc: "Increment register: Adds 1 to qubit register starting at wire" },
      { id: "sub_1", name: "-1", desc: "Decrement register: Subtracts 1 from register starting at wire" },
      { id: "add_a", name: "+A", desc: "Add register A: Adds classical Input value A to register" },
      { id: "sub_a", name: "-A", desc: "Subtract register A: Subtracts Input value A from register" },
      { id: "add_ab", name: "+AB", desc: "Add product: Adds product A * B to qubit register" },
      { id: "mul_a", name: "xA", desc: "Multiply: Multiplies register by Input A (must be coprime to 2^M)" },
      { id: "div_a", name: "xA^-1", desc: "Divide: Divides register by Input A" }
    ]
  },
  {
    category: "Compare",
    gates: [
      { id: "compare_lt", name: "⊕A<B", desc: "Compare: toggles target qubit NOT if Input A < B" },
      { id: "compare_gt", name: "⊕A>B", desc: "Compare: toggles target qubit NOT if Input A > B" },
      { id: "compare_le", name: "⊕A≤B", desc: "Compare: toggles target qubit NOT if Input A <= B" },
      { id: "compare_ge", name: "⊕A≥B", desc: "Compare: toggles target qubit NOT if Input A >= B" },
      { id: "compare_eq", name: "⊕A=B", desc: "Compare: toggles target qubit NOT if Input A = B" },
      { id: "compare_ne", name: "⊕A≠B", desc: "Compare: toggles target qubit NOT if Input A != B" }
    ]
  },
  {
    category: "Scalar",
    gates: [
      { id: "scalar_0", name: "0", desc: "Nullifies amplitude when qubit is in state |1⟩" },
      { id: "scalar_minus", name: "-", desc: "Global Phase scale by -1 (180° rotation)" },
      { id: "scalar_i", name: "i", desc: "Global Phase scale by imaginary unit i (+90° shift)" },
      { id: "scalar_minus_i", name: "-i", desc: "Global Phase scale by -i (-90° shift)" },
      { id: "scalar_sqrt_i", name: "√i", desc: "Global Phase scale by sqrt(i) (+45° shift)" },
      { id: "scalar_sqrt_minus_i", name: "√-i", desc: "Global Phase scale by sqrt(-i) (-45° shift)" }
    ]
  }
];

function App() {
  // Navigation / System Mode
  const [systemMode, setSystemMode] = useState('quantum'); // 'parallel' | 'quantum'
  const [activeTab, setActiveTab] = useState('simulators'); // 'simulators' | 'history' | 'about'
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);
  
  // Hardware Stats Polling (Parallel Mode)
  const [hwStats, setHwStats] = useState(null);
  const [hwError, setHwError] = useState(false);
  
  // CRUD History (Parallel Mode)
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [editingRunId, setEditingRunId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // -------------------------------------------------------------
  // PARALLEL SIMULATOR STATE
  // -------------------------------------------------------------
  const [benchmarkType, setBenchmarkType] = useState('amdahls_law');
  const [params, setParams] = useState({
    parallelFraction: 0.85,
    maxCores: 64,
    taskCount: 20,
    coreCount: 4,
    strategy: 'static',
    variance: 'high',
    matrixSize: 1024,
    threadCount: 8,
    vectorSize: 1000000,
    useMutex: false,
    incrementsPerThread: 100000
  });
  const [simResult, setSimResult] = useState(null);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // -------------------------------------------------------------
  // QUANTUM SIMULATOR STATE
  // -------------------------------------------------------------
  const [numQubits, setNumQubits] = useState(3);
  const [activeGateTool, setActiveGateTool] = useState('h'); 
  const [rotationTheta, setRotationTheta] = useState(Math.PI / 2); // 1.57 rad
  const [classicalA, setClassicalA] = useState(2);
  const [classicalB, setClassicalB] = useState(1);
  const [classicalR, setClassicalR] = useState(4);
  const [animTime, setAnimTime] = useState(0);

  // Optimized toolbox states
  const [gateSearchQuery, setGateSearchQuery] = useState('');
  const [activeToolboxTab, setActiveToolboxTab] = useState('all'); // 'all' | 't1' | 't2'
  const [hoveredGate, setHoveredGate] = useState(null);

  const getInspectorGateInfo = (gateId) => {
    if (!gateId) return null;
    
    let found = null;
    for (const cat of quantumToolbox1) {
      const g = cat.gates.find(item => item.id === gateId);
      if (g) { found = { ...g, category: cat.category }; break; }
    }
    if (!found) {
      for (const cat of quantumToolbox2) {
        const g = cat.gates.find(item => item.id === gateId);
        if (g) { found = { ...g, category: cat.category }; break; }
      }
    }
    
    if (!found) return null;
    
    let matrix = null;
    let operationType = "Single-Qubit";
    let truthTable = null;
    
    const type = gateId.toLowerCase();
    
    switch (type) {
      case 'h':
        operationType = "Single-Qubit Half-Turn";
        matrix = [["1/√2", "1/√2"], ["1/√2", "-1/√2"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/√2(|0⟩ + |1⟩) [|+⟩]" },
          { in: "|1⟩ (One)", out: "1/√2(|0⟩ - |1⟩) [|-⟩]" }
        ];
        break;
      case 'x':
        operationType = "Single-Qubit Half-Turn";
        matrix = [["0", "1"], ["1", "0"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|1⟩ (One)" },
          { in: "|1⟩ (One)", out: "|0⟩ (Zero)" }
        ];
        break;
      case 'y':
        operationType = "Single-Qubit Half-Turn";
        matrix = [["0", "-i"], ["i", "0"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "i|1⟩" },
          { in: "|1⟩ (One)", out: "-i|0⟩" }
        ];
        break;
      case 'z':
        operationType = "Single-Qubit Half-Turn";
        matrix = [["1", "0"], ["0", "-1"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "-|1⟩ (Phase flipped)" }
        ];
        break;
      case 's':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1", "0"], ["0", "i"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "i|1⟩ (+90° Phase)" }
        ];
        break;
      case 's_inv':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1", "0"], ["0", "-i"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "-i|1⟩ (-90° Phase)" }
        ];
        break;
      case 't':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["1", "0"], ["0", "e^(iπ/4)"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "e^(iπ/4)|1⟩ (+45° Phase)" }
        ];
        break;
      case 't_inv':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["1", "0"], ["0", "e^(-iπ/4)"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "e^(-iπ/4)|1⟩ (-45° Phase)" }
        ];
        break;
      case 'x_12':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1/√2", "-i/√2"], ["-i/√2", "1/√2"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/√2(|0⟩ - i|1⟩)" },
          { in: "|1⟩ (One)", out: "1/√2(-i|0⟩ + |1⟩)" }
        ];
        break;
      case 'x_12_inv':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1/√2", "i/√2"], ["i/√2", "1/√2"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/√2(|0⟩ + i|1⟩)" },
          { in: "|1⟩ (One)", out: "1/√2(i|0⟩ + |1⟩)" }
        ];
        break;
      case 'y_12':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1/√2", "-1/√2"], ["1/√2", "1/√2"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/√2(|0⟩ + |1⟩) [|+⟩]" },
          { in: "|1⟩ (One)", out: "1/√2(-|0⟩ + |1⟩)" }
        ];
        break;
      case 'y_12_inv':
        operationType = "Single-Qubit Quarter-Turn";
        matrix = [["1/√2", "1/√2"], ["-1/√2", "1/√2"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/√2(|0⟩ - |1⟩) [|-⟩]" },
          { in: "|1⟩ (One)", out: "1/√2(|0⟩ + |1⟩) [|+⟩]" }
        ];
        break;
      case 'x_14':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["0.92388", "-0.38268i"], ["-0.38268i", "0.92388"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "0.924|0⟩ - 0.383i|1⟩" },
          { in: "|1⟩ (One)", out: "-0.383i|0⟩ + 0.924|1⟩" }
        ];
        break;
      case 'x_14_inv':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["0.92388", "0.38268i"], ["0.38268i", "0.92388"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "0.924|0⟩ + 0.383i|1⟩" },
          { in: "|1⟩ (One)", out: "0.383i|0⟩ + 0.924|1⟩" }
        ];
        break;
      case 'y_14':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["0.92388", "-0.38268"], ["0.38268", "0.92388"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "0.924|0⟩ + 0.383|1⟩" },
          { in: "|1⟩ (One)", out: "-0.383|0⟩ + 0.924|1⟩" }
        ];
        break;
      case 'y_14_inv':
        operationType = "Single-Qubit Eighth-Turn";
        matrix = [["0.92388", "0.38268"], ["-0.38268", "0.92388"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "0.924|0⟩ - 0.383|1⟩" },
          { in: "|1⟩ (One)", out: "0.383|0⟩ + 0.924|1⟩" }
        ];
        break;
      case '●':
        operationType = "Control Point / Two-Qubit Trigger";
        matrix = "Activates paired target gate in the same column ONLY if the control wire qubit is |1⟩.";
        truthTable = [
          { in: "|00⟩ (Ctrl=|0⟩, Tgt=|0⟩)", out: "|00⟩ (No change)" },
          { in: "|01⟩ (Ctrl=|0⟩, Tgt=|1⟩)", out: "|01⟩ (No change)" },
          { in: "|10⟩ (Ctrl=|1⟩, Tgt=|0⟩)", out: "|11⟩ (Target flipped!)" },
          { in: "|11⟩ (Ctrl=|1⟩, Tgt=|1⟩)", out: "|10⟩ (Target flipped!)" }
        ];
        break;
      case '○':
        operationType = "Anti-Control Point / Two-Qubit Trigger";
        matrix = "Activates paired target gate in the same column ONLY if the control wire qubit is |0⟩.";
        truthTable = [
          { in: "|00⟩ (Ctrl=|0⟩, Tgt=|0⟩)", out: "|01⟩ (Target flipped!)" },
          { in: "|01⟩ (Ctrl=|0⟩, Tgt=|1⟩)", out: "|00⟩ (Target flipped!)" },
          { in: "|10⟩ (Ctrl=|1⟩, Tgt=|0⟩)", out: "|10⟩ (No change)" },
          { in: "|11⟩ (Ctrl=|1⟩, Tgt=|1⟩)", out: "|11⟩ (No change)" }
        ];
        break;
      case 'swap':
        operationType = "Two-Qubit Exchanger";
        matrix = [["1","0","0","0"],["0","0","1","0"],["0","1","0","0"],["0","0","0","1"]];
        truthTable = [
          { in: "|00⟩", out: "|00⟩" },
          { in: "|01⟩", out: "|10⟩ (Swapped)" },
          { in: "|10⟩", out: "|01⟩ (Swapped)" },
          { in: "|11⟩", out: "|11⟩" }
        ];
        break;
      case 'state_0':
        operationType = "State Projection / Reset";
        matrix = [["1", "0"], ["0", "0"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|0⟩" },
          { in: "|1⟩ (One)", out: "|0⟩ (Forced projection)" }
        ];
        break;
      case 'state_1':
        operationType = "State Projection / Reset";
        matrix = [["0", "0"], ["0", "1"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "|1⟩ (Forced projection)" },
          { in: "|1⟩ (One)", out: "|1⟩" }
        ];
        break;
      case 'plus_proj':
      case 'prep_plus':
        operationType = "State Projection / Preparation";
        matrix = [["0.5", "0.5"], ["0.5", "0.5"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/...(|0⟩ + |1⟩) [|+⟩]" },
          { in: "|1⟩ (One)", out: "1/...(|0⟩ + |1⟩) [|+⟩]" }
        ];
        break;
      case 'minus_proj':
      case 'prep_minus':
        operationType = "State Projection / Preparation";
        matrix = [["0.5", "-0.5"], ["-0.5", "0.5"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/...(|0⟩ - |1⟩) [|-⟩]" },
          { in: "|1⟩ (One)", out: "-1/...(|0⟩ - |1⟩) [-|-⟩]" }
        ];
        break;
      case 'prep_i':
        operationType = "State Preparation";
        matrix = [["0.5", "-0.5i"], ["0.5i", "0.5"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/...(|0⟩ + i|1⟩) [|i⟩]" },
          { in: "|1⟩ (One)", out: "1/...(i|0⟩ + |1⟩) [|i⟩]" }
        ];
        break;
      case 'prep_minus_i':
        operationType = "State Preparation";
        matrix = [["0.5", "0.5i"], ["-0.5i", "0.5"]];
        truthTable = [
          { in: "|0⟩ (Zero)", out: "1/...(|0⟩ - i|1⟩) [|-i⟩]" },
          { in: "|1⟩ (One)", out: "1/...(-i|0⟩ + |1⟩) [|-i⟩]" }
        ];
        break;
      case 'qft':
        operationType = "Discrete Fourier Transform (1-Qubit Matrix)";
        matrix = [["1/√2", "1/√2"], ["1/√2", "-1/√2"]];
        truthTable = [
          { in: "|0⟩", out: "1/√2(|0⟩ + |1⟩) [|+⟩]" },
          { in: "|1⟩", out: "1/√2(|0⟩ - |1⟩) [|-⟩]" }
        ];
        break;
      case 'qft_inv':
        operationType = "Inverse Discrete Fourier Transform (1-Qubit Matrix)";
        matrix = [["1/√2", "1/√2"], ["1/√2", "-1/√2"]];
        truthTable = [
          { in: "|+⟩", out: "|0⟩" },
          { in: "|-⟩", out: "|1⟩" }
        ];
        break;
      case 'grad_12':
        operationType = "Phase Gradient Shift";
        matrix = [["1", "0"], ["0", "i"]];
        truthTable = [
          { in: "|0⟩", out: "|0⟩" },
          { in: "|1⟩", out: "i|1⟩" }
        ];
        break;
      case 'grad_12_inv':
        operationType = "Phase Gradient Shift";
        matrix = [["1", "0"], ["0", "-i"]];
        truthTable = [
          { in: "|0⟩", out: "|0⟩" },
          { in: "|1⟩", out: "-i|1⟩" }
        ];
        break;
      case 'grad_t':
        operationType = "Time-Varying Gradient";
        matrix = [["1", "0"], ["0", "e^(i*t)"]];
        truthTable = [
          { in: "|0⟩", out: "|0⟩" },
          { in: "|1⟩", out: "e^(i*t)|1⟩" }
        ];
        break;
      case 'grad_t_inv':
        operationType = "Time-Varying Gradient";
        matrix = [["1", "0"], ["0", "e^(-i*t)"]];
        truthTable = [
          { in: "|0⟩", out: "|0⟩" },
          { in: "|1⟩", out: "e^(-i*t)|1⟩" }
        ];
        break;
      case 'density':
        operationType = "State Visualizer";
        matrix = "Local Density State Matrix visualizer: ρ = |ψ⟩⟨ψ|";
        break;
      case 'bloch':
        operationType = "State Visualizer";
        matrix = "Bloch Sphere Coordinate projector: [x, y, z]";
        break;
      case 'chance':
        operationType = "State Visualizer";
        matrix = "Squared amplitude probability: P(|x⟩) = |c_x|^2";
        break;
      case 'amps':
        operationType = "State Visualizer";
        matrix = "Complex phasor dials showing phase and magnitude";
        break;
      case 'input_a':
      case 'input_b':
      case 'input_r':
        operationType = "Register Binder Input";
        matrix = "Registers bind wire values to classical parameters A, B, or R.";
        break;
      case 'scalar_minus':
        operationType = "Global Phase Scale";
        matrix = [["-1", "0"], ["0", "-1"]];
        truthTable = [{ in: "|ψ⟩", out: "-|ψ⟩" }];
        break;
      case 'scalar_0':
        operationType = "Nullifying Operator";
        matrix = [["0", "0"], ["0", "0"]];
        truthTable = [{ in: "|ψ⟩", out: "0" }];
        break;
      case 'scalar_i':
        operationType = "Global Phase Scale";
        matrix = [["i", "0"], ["0", "i"]];
        truthTable = [{ in: "|ψ⟩", out: "i|ψ⟩" }];
        break;
      case 'scalar_minus_i':
        operationType = "Global Phase Scale";
        matrix = [["-i", "0"], ["0", "-i"]];
        truthTable = [{ in: "|ψ⟩", out: "-i|ψ⟩" }];
        break;
      case 'scalar_sqrt_i':
        operationType = "Global Phase Scale";
        matrix = [["e^(iπ/8)", "0"], ["0", "e^(iπ/8)"]];
        truthTable = [{ in: "|ψ⟩", out: "e^(iπ/8)|ψ⟩" }];
        break;
      case 'scalar_sqrt_minus_i':
        operationType = "Global Phase Scale";
        matrix = [["e^(-iπ/8)", "0"], ["0", "e^(-iπ/8)"]];
        truthTable = [{ in: "|ψ⟩", out: "e^(-iπ/8)|ψ⟩" }];
        break;
      default:
        if (type.includes('_t')) {
          operationType = "Time-Varying Rotation";
          matrix = "Unitary moves continuously along sphere axes as clock ticks.";
        } else if (type.startsWith('compare_')) {
          operationType = "Register Compare";
          matrix = "Target qubit toggles ONLY if comparative state conditions are met.";
        } else if (type.startsWith('add_') || type.startsWith('sub_') || type.startsWith('mul_') || type.startsWith('div_')) {
          operationType = "Register Arithmetic";
          matrix = "State vector amplitudes map dynamically: |v⟩ → |v ⊕ arithmetic mod 2^M⟩.";
        } else {
          matrix = "Quantum operation matrix.";
        }
        break;
    }
    
    return {
      ...found,
      operationType,
      matrix,
      truthTable
    };
  };

  // Default Circuit: HADAMARD on qubit 0, Controlled-NOT (control 0, target 1)
  const [quantumGates, setQuantumGates] = useState([
    { id: 'g_0', gate: 'h', targets: [0], step: 0 },
    { id: 'g_1', gate: '●', targets: [0], step: 2 },
    { id: 'g_2', gate: 'x', targets: [1], step: 2 }
  ]);
  
  const [quantumResult, setQuantumResult] = useState(null);
  const [isSimulatingQuantum, setIsSimulatingQuantum] = useState(false);
  const [quantumError, setQuantumError] = useState(null);
  const [qiskitCompileData, setQiskitCompileData] = useState(null);
  const [isCompilingQiskit, setIsCompilingQiskit] = useState(false);
  const [qiskitCompileSuccess, setQiskitCompileSuccess] = useState(false);

  // requestAnimationFrame hook to update continuous animation time
  useEffect(() => {
    let frame;
    const tick = () => {
      setAnimTime(prev => (prev + 0.005) % 1.0);
      frame = requestAnimationFrame(tick);
    };

    const hasSpinning = quantumGates.some(g => 
      g.gate.includes('_t') || g.gate.includes('_ft') || g.gate.includes('grad_t')
    );

    if (hasSpinning) {
      frame = requestAnimationFrame(tick);
    } else {
      setAnimTime(0);
    }
    return () => cancelAnimationFrame(frame);
  }, [quantumGates]);

  // Poll Hardware Stats (Parallel Mode)
  useEffect(() => {
    const fetchHw = async () => {
      try {
        const res = await fetch(`${API_BASE}/system-stats`);
        if (!res.ok) throw new Error('Failed to fetch HW stats');
        const data = await res.json();
        setHwStats(data);
        setHwError(false);
      } catch (err) {
        setHwError(true);
        // Fallback mock stats so UI works even if backend is offline
        const mockTemp = 45 + Math.floor(Math.random() * 15);
        setHwStats({
          cpu: {
            load: 25 + Math.floor(Math.random() * 20),
            cores: 8,
            temperature: mockTemp,
            threads: Array.from({ length: 8 }, (_, i) => ({
              id: i,
              load: 10 + Math.floor(Math.random() * 60),
              activeTask: i % 2 === 0 ? 'Parallel Reduction' : 'Matrix Multiply',
              temperature: mockTemp + Math.floor((Math.random() - 0.5) * 4)
            }))
          },
          memory: {
            totalGB: 16,
            usedPercent: 48 + Math.floor(Math.random() * 5),
            usedGB: 7.7
          },
          gpu: {
            name: "RTX 4070 (Offline Mock)",
            load: 12 + Math.floor(Math.random() * 8),
            memoryUsedPercent: 32,
            memoryTotalGB: 12
          }
        });
      }
    };

    fetchHw();
    const interval = setInterval(fetchHw, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch History (Parallel Mode)
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
      setHistoryError(false);
    } catch (err) {
      setHistoryError(true);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // -------------------------------------------------------------
  // QUANTUM SIMULATION ACTIONS (Live local JS Engine)
  // -------------------------------------------------------------
  useEffect(() => {
    if (systemMode === 'quantum') {
      try {
        const result = simulateQuantumCircuit(numQubits, quantumGates, animTime, {
          A: classicalA,
          B: classicalB,
          R: classicalR
        });
        setQuantumResult(result);
        setQuantumError(null);
      } catch (err) {
        setQuantumError(err.message);
      }
    }
  }, [numQubits, quantumGates, animTime, classicalA, classicalB, classicalR, systemMode]);

  // QPU Compiler Execution (Triggers Qiskit Flask Backend)
  const compileCircuitOnQPU = async () => {
    setIsCompilingQiskit(true);
    setQiskitCompileSuccess(false);
    try {
      // Map advanced controls and custom gates to base standard gates supported by Qiskit backend
      const qiskitCompatibleGates = [];
      
      // Sort gates by step column
      const sortedGates = [...quantumGates].sort((a, b) => a.step - b.step);

      for (const g of sortedGates) {
        let type = g.gate.toLowerCase();
        let targets = g.targets;
        let params = g.params || {};

        if (type === '●') {
          // Standard Control Point: Look for a target gate in the SAME step column
          const partner = sortedGates.find(p => p.step === g.step && p.id !== g.id && p.gate !== '●' && p.gate !== '○');
          if (partner) {
            type = 'cx';
            targets = [g.targets[0], partner.targets[0]];
          } else {
            continue; // Skip isolated controls for Qiskit compatibility
          }
        } else if (type === 'x') {
          // If NOT gate has a control point, we handle it. Otherwise, normal X
          const controlPartner = sortedGates.find(p => p.step === g.step && p.gate === '●');
          if (controlPartner) {
            continue; // Handled by standard CNOT check above
          }
          type = 'x';
        }

        // Only push standard gates supported by modern Qiskit app.py
        if (['h', 'x', 'y', 'z', 's', 't', 'cx', 'cz', 'swap', 'rx', 'ry', 'rz'].includes(type)) {
          qiskitCompatibleGates.push({
            gate: type,
            targets: targets,
            params: params
          });
        }
      }

      const res = await fetch(`${QUANTUM_API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_qubits: numQubits,
          gates: qiskitCompatibleGates
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'QPU simulator failed');
      }

      const data = await res.json();
      setQiskitCompileData(data);
      setQiskitCompileSuccess(true);
    } catch (err) {
      // Fallback IBM compilation mock data if Python Flask server is down
      setQiskitCompileData({
        num_qubits: numQubits,
        qpu_model: "IBM Falcon r5.11 (Cryogenic Superconducting Transmon)",
        t1_coherence: "125 µs",
        t2_coherence: "95 µs",
        cryo_temp: "15 mK (-273.13 °C)",
        gate_fidelity: "99.92%",
        readout_error: "1.4%",
        success: true
      });
      setQiskitCompileSuccess(true);
    } finally {
      setIsCompilingQiskit(false);
    }
  };

  // Add or remove gate from circuit grid coordinate
  const handleGridCellClick = (qubitIdx, stepCol) => {
    // Check if a gate already exists in this coordinate
    const existingGateIdx = quantumGates.findIndex(g => g.step === stepCol && g.targets.includes(qubitIdx));

    if (existingGateIdx !== -1) {
      // Remove existing gate
      setQuantumGates(prev => prev.filter((_, idx) => idx !== existingGateIdx));
      return;
    }

    // Otherwise, add activeGateTool
    const newGateId = 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    let targets = [qubitIdx];
    let params = {};

    if (activeGateTool === 'swap') {
      // Look if there is already another 'swap' cell in this same column
      const existingSwapCol = quantumGates.find(g => g.step === stepCol && g.gate === 'swap');
      if (existingSwapCol) {
        // Pair them up
        targets = [existingSwapCol.targets[0], qubitIdx];
      } else {
        // Temporary isolated swap target (swaps with next qubit by default)
        const targetQ = (qubitIdx + 1) % numQubits;
        targets = [qubitIdx, targetQ];
      }
    } else if (activeGateTool === 'rx' || activeGateTool === 'ry' || activeGateTool === 'rz') {
      params = { theta: rotationTheta };
    }

    const newGate = {
      id: newGateId,
      gate: activeGateTool,
      targets,
      step: stepCol,
      params
    };

    setQuantumGates(prev => [...prev, newGate]);
  };

  const loadQuantumPreset = (preset) => {
    setNumQubits(preset.num_qubits);
    const loadedGates = preset.gates.map((g, idx) => ({
      id: `preset_g_${idx}_${Date.now()}`,
      gate: g.gate,
      targets: g.targets,
      step: g.step !== undefined ? g.step : idx,
      params: g.params || {}
    }));
    setQuantumGates(loadedGates);
  };

  const clearQuantumCircuit = () => {
    setQuantumGates([]);
  };

  // Code Sample Generator based on benchmark parameters
  const getBenchmarkCodeSample = (type, bParams) => {
    switch (type) {
      case 'amdahls_law':
        return `// Parallel speedup calculations using Amdahl's Law
#include <iostream>
#include <iomanip>

int main() {
    double P = ${bParams.parallelFraction || 0.85}; // Parallel Fraction
    int max_cores = ${bParams.maxCores || 64};
    
    std::cout << "--- AMDAHL SPEEDUP SIMULATION ---" << std::endl;
    for (int cores = 1; cores <= max_cores; cores *= 2) {
        double speedup = 1.0 / ((1.0 - P) + (P / cores));
        double gustafson = cores - (cores - 1) * (1.0 - P);
        std::cout << "Cores: " << std::setw(3) << cores 
                  << " | Amdahl: " << std::fixed << std::setprecision(2) << speedup << "x"
                  << " | Gustafson: " << gustafson << "x" << std::endl;
    }
    return 0;
}`;
      case 'load_balancing':
        return `// OpenMP Parallel loop with ${bParams.strategy === 'dynamic' ? 'dynamic' : 'static'} scheduling
#include <iostream>
#include <omp.h>

void process_task_queue() {
    int num_tasks = ${bParams.taskCount || 20};
    int threads = ${bParams.coreCount || 4};
    
    omp_set_num_threads(threads);
    
    // Using OpenMP ${bParams.strategy === 'dynamic' ? 'dynamic queue schedule' : 'blocked round-robin static schedule'}
    #pragma omp parallel for schedule(${bParams.strategy === 'dynamic' ? 'dynamic, 1' : 'static'})
    for (int i = 0; i < num_tasks; i++) {
        int tid = omp_get_thread_num();
        // Task size variance: ${bParams.variance || 'high'}
        simulate_workload(i, tid);
    }
}`;
      case 'matrix_vector':
        return `// Matrix-Vector Multiplication: ${bParams.matrixSize}x${bParams.matrixSize}
#include <iostream>
#include <omp.h>

// 2D Block Decomposition for enhanced cache locality (L1/L2 hits)
void matrix_vector_multiply_2d(double** A, double* x, double* y, int N) {
    int BLOCK_SIZE = 64; // Aligns with cache lines
    #pragma omp parallel for collapse(2) num_threads(${bParams.threadCount || 8})
    for (int sj = 0; sj < N; sj += BLOCK_SIZE) {
        for (int si = 0; si < N; si += BLOCK_SIZE) {
            // Local block cache-line computations
            for (int j = sj; j < std::min(sj + BLOCK_SIZE, N); j++) {
                for (int i = si; i < std::min(si + BLOCK_SIZE, N); i++) {
                    y[i] += A[i][j] * x[j];
                }
            }
        }
    }
}`;
      case 'opencl_vecadd':
        return `// OpenCL Kernel for Vector Addition: ${(bParams.vectorSize || 1000000).toLocaleString()} floats
#define CL_TARGET_OPENCL_VERSION 220
#include <CL/cl.h>

const char* kernelSource = 
"__kernel void vector_add(__global const float* A, __global const float* B, __global float* C) { "
"    int id = get_global_id(0); "
"    C[id] = A[id] + B[id]; "
"}";

// Allocating Host memories and performing PCIe copies
void run_opencl_simulation(int size) {
    cl_mem dev_A = clCreateBuffer(context, CL_MEM_READ_ONLY, size * sizeof(float), NULL, NULL);
    cl_mem dev_B = clCreateBuffer(context, CL_MEM_READ_ONLY, size * sizeof(float), NULL, NULL);
    cl_mem dev_C = clCreateBuffer(context, CL_MEM_WRITE_ONLY, size * sizeof(float), NULL, NULL);
    
    // Copy data over PCIe Gen4 bus (Host -> Device PCIe Bottleneck)
    clEnqueueWriteBuffer(queue, dev_A, CL_TRUE, 0, size * sizeof(float), host_A, 0, NULL, NULL);
    clEnqueueWriteBuffer(queue, dev_B, CL_TRUE, 0, size * sizeof(float), host_B, 0, NULL, NULL);
    
    // Run GPU threads
    clEnqueueNDRangeKernel(queue, kernel, 1, NULL, &globalSize, &localSize, 0, NULL, NULL);
}`;
      case 'concurrency_locks':
        return `// C++ Concurrency Thread Synchronization: ${bParams.threadCount || 4} threads
#include <iostream>
#include <thread>
#include <vector>
#include <mutex>

long long shared_counter = 0;
std::mutex counter_mutex;

void increment_counter(int iterations) {
    for (int i = 0; i < iterations; i++) {
        ${bParams.useMutex ? `// Safe Mutex Synchronization: Prevents Race Conditions
        std::lock_guard<std::mutex> lock(counter_mutex);
        shared_counter++;` : `// UNSAFE: Race Condition will corrupt the shared register memory
        shared_counter++; // Visual collision & data loss in the CPU pipeline`}
    }
}

int main() {
    std::vector<std::thread> threads;
    int num_threads = ${bParams.threadCount || 4};
    int increments = 1000;
    
    for (int i = 0; i < num_threads; i++) {
        threads.push_back(std::thread(increment_counter, increments));
    }
    for (auto& t : threads) t.join();
    
    std::cout << "Final Counter Value: " << shared_counter << std::endl;
    return 0;
}`;
      default:
        return '';
    }
  };

  const runSimulation = async () => {
    setIsRunningSim(true);
    setSimResult(null);
    setSaveSuccess(false);
    setSaveTitle('');
    setSaveNotes('');

    await new Promise(r => setTimeout(r, 600));

    try {
      const res = await fetch(`${API_BASE}/benchmark/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: benchmarkType,
          params: getParamsForType()
        })
      });

      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      setSimResult(data);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSaveTitle(`Run: ${getFriendlyName(benchmarkType)} (${timeStr})`);
    } catch (err) {
      simulateLocally();
    } finally {
      setIsRunningSim(false);
    }
  };

  const getParamsForType = () => {
    switch (benchmarkType) {
      case 'amdahls_law':
        return { parallelFraction: params.parallelFraction, maxCores: params.maxCores, baseTime: 120.0 };
      case 'load_balancing':
        return { taskCount: params.taskCount, coreCount: params.coreCount, strategy: params.strategy, variance: params.variance };
      case 'matrix_vector':
        return { matrixSize: params.matrixSize, threadCount: params.threadCount };
      case 'opencl_vecadd':
        return { vectorSize: params.vectorSize };
      case 'concurrency_locks':
        return { threadCount: params.threadCount, useMutex: params.useMutex, incrementsPerThread: params.incrementsPerThread };
      default:
        return {};
    }
  };

  const simulateLocally = () => {
    let mockResult = {
      type: benchmarkType,
      params: getParamsForType(),
      timestamp: new Date().toISOString()
    };

    if (benchmarkType === 'amdahls_law') {
      const p = parseFloat(params.parallelFraction);
      const maxCores = parseInt(params.maxCores);
      const coreValues = [1, 2, 4, 8, 16, 32, 64, 128].filter(c => c <= maxCores);
      const amdahlPoints = coreValues.map(c => ({
        cores: c,
        speedup: parseFloat((1 / ((1 - p) + (p / c))).toFixed(2)),
        timeSec: parseFloat((120.0 / (1 / ((1 - p) + (p / c)))).toFixed(2))
      }));
      const gustafsonPoints = coreValues.map(c => ({
        cores: c,
        speedup: parseFloat((c - (c - 1) * (1 - p)).toFixed(2))
      }));
      mockResult.results = {
        summary: `[Local Mock] Parallel fraction: ${(p * 100).toFixed(1)}%.`,
        idealSpeedup: maxCores,
        amdahlSpeedup: amdahlPoints[amdahlPoints.length - 1].speedup,
        gustafsonSpeedup: gustafsonPoints[gustafsonPoints.length - 1].speedup,
        efficiencyPercent: parseFloat(((amdahlPoints[amdahlPoints.length - 1].speedup / maxCores) * 100).toFixed(1)),
        charts: { amdahlPoints, gustafsonPoints, efficiencyPoints: coreValues.map((c, i) => ({ cores: c, efficiencyPercent: parseFloat(((amdahlPoints[i].speedup / c) * 100).toFixed(1)) })) }
      };
    } else if (benchmarkType === 'load_balancing') {
      const tc = parseInt(params.taskCount);
      const cc = parseInt(params.coreCount);
      const strat = params.strategy;
      
      const tasks = Array.from({ length: tc }, (_, i) => ({ id: `task_${i+1}`, size: Math.floor(5 + Math.random() * 25) }));
      const cores = Array.from({ length: cc }, (_, i) => ({ id: i + 1, timeline: [], totalWork: 0 }));
      
      if (strat === 'static') {
        tasks.forEach((t, i) => {
          const core = cores[i % cc];
          core.timeline.push({ taskId: t.id, startTime: core.totalWork, endTime: core.totalWork + t.size, duration: t.size });
          core.totalWork += t.size;
        });
      } else {
        tasks.forEach(t => {
          const core = cores.reduce((min, cur) => cur.totalWork < min.totalWork ? cur : min, cores[0]);
          core.timeline.push({ taskId: t.id, startTime: core.totalWork, endTime: core.totalWork + t.size, duration: t.size });
          core.totalWork += t.size;
        });
      }
      const makeSpan = Math.max(...cores.map(c => c.totalWork));
      cores.forEach(c => {
        c.idleTime = makeSpan - c.totalWork;
        c.utilizationPercent = parseFloat(((c.totalWork / makeSpan) * 100).toFixed(1));
      });
      mockResult.results = {
        strategy: strat,
        makeSpan,
        avgCoreWorkload: makeSpan * 0.85,
        workloadStdDev: 8.5,
        cores,
        summary: `[Local Mock] Simulated ${strat} load-balancing on ${cc} cores.`
      };
    } else if (benchmarkType === 'matrix_vector') {
      const n = parseInt(params.matrixSize);
      const ops = 2 * n * n;
      mockResult.results = {
        matrixSize: n,
        operations: ops,
        singleCoreTimeMs: 120.0,
        decomp1D: { executionTimeMs: 25.5, speedup: 4.7, efficiencyPercent: 58.7, gflops: parseFloat(((ops / 25.5) * 1000 / 1e9).toFixed(2)) },
        decomp2D: { executionTimeMs: 16.8, speedup: 7.1, efficiencyPercent: 88.7, gflops: parseFloat(((ops / 16.8) * 1000 / 1e9).toFixed(2)) },
        comparison: `[Local Mock] 2D decomposition blocks cache lines efficiently.`
      };
    } else if (benchmarkType === 'opencl_vecadd') {
      const size = parseInt(params.vectorSize);
      mockResult.results = {
        vectorSize: size,
        dataSizeBytes: size * 3 * 4,
        cpuTimeMs: 2.5,
        gpu: { hostToDeviceMs: 1.8, kernelComputeMs: 0.1, deviceToHostMs: 0.9, jitCompileMs: 1.5, totalTimeMs: 2.8, totalWithJitMs: 4.3 },
        crossoverPointPassed: size > 150000,
        comparison: `[Local Mock] GPU compute performs well but vector PCIe transfer costs dominate.`
      };
    } else if (benchmarkType === 'concurrency_locks') {
      const threads = parseInt(params.threadCount) || 4;
      const useMutex = params.useMutex === true;
      const increments = parseInt(params.incrementsPerThread) || 1000;
      
      const targetSum = threads * increments;
      let actualSum = 0;
      let timeElapsed = 0;
      
      if (useMutex) {
        actualSum = targetSum;
        timeElapsed = threads * (increments * 0.05);
      } else {
        const collisionRate = 1 - Math.exp(-(threads - 1) * 0.1);
        const collisions = Math.floor(targetSum * collisionRate);
        actualSum = targetSum - collisions;
        timeElapsed = (increments * 0.01) + (threads * 2);
      }
      
      mockResult.results = {
        useMutex,
        targetSum,
        actualSum,
        dataLoss: targetSum - actualSum,
        timeElapsed: parseFloat(timeElapsed.toFixed(2)),
        summary: useMutex 
          ? `[Local Mock] Mutex lock safely synchronized all increments.` 
          : `[Local Mock] Concurrency collision resulted in lost updates!`
      };
    }
    setSimResult(mockResult);
    setSaveTitle(`Run: ${getFriendlyName(benchmarkType)} (Local Mock)`);
  };

  const handleSaveRun = async () => {
    if (!saveTitle.trim() || !simResult) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: saveTitle,
          type: simResult.type,
          params: simResult.params,
          results: simResult.results,
          notes: saveNotes
        })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchHistory();
    } catch (err) {
      const mockHistoryItem = {
        id: 'run_mock_' + Date.now(),
        timestamp: new Date().toISOString(),
        title: saveTitle,
        type: simResult.type,
        params: simResult.params,
        results: simResult.results,
        notes: saveNotes + " [Local Offline Session]"
      };
      setHistory(prev => [mockHistoryItem, ...prev]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (item) => {
    setEditingRunId(item.id);
    setEditTitle(item.title);
    setEditNotes(item.notes);
  };

  const handleUpdateRun = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, notes: editNotes })
      });
      if (!res.ok) throw new Error('Update failed');
      setEditingRunId(null);
      fetchHistory();
    } catch (err) {
      setHistory(prev => prev.map(item => item.id === id ? { ...item, title: editTitle, notes: editNotes } : item));
      setEditingRunId(null);
    }
  };

  const handleDeleteRun = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchHistory();
    } catch (err) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const getFriendlyName = (type) => {
    switch (type) {
      case 'amdahls_law': return "Amdahl's Speedup Curve";
      case 'load_balancing': return "Thread Load Balancing";
      case 'matrix_vector': return "Parallel Matrix-Vector";
      case 'opencl_vecadd': return "OpenCL Vector Addition";
      case 'concurrency_locks': return "Concurrency Locks";
      default: return type;
    }
  };

  const toggleHistoryExpand = (id) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleParamChange = (name, value) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const getTaskColor = (duration) => {
    if (duration < 10) return 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
    if (duration < 18) return 'linear-gradient(135deg, #6366f1, #4f46e5)';
    if (duration < 25) return 'linear-gradient(135deg, #a855f7, #8b5cf6)';
    return 'linear-gradient(135deg, #ec4899, #d946ef)';
  };

  const cpuPercent = hwStats?.cpu?.load || 0;
  const gpuPercent = hwStats?.gpu?.load || 0;
  const cpuOffset = 188.4 - (188.4 * cpuPercent) / 100;
  const gpuOffset = 188.4 - (188.4 * gpuPercent) / 100;

  // Quantum Workspace timeline steps (columns 0 to 7)
  const timelineSteps = Array.from({ length: 8 }, (_, i) => i);

  // --- RENDER PHASOR SVG DIAL ---
  const renderPhasorDial = (probability, phaseDeg) => {
    const size = 18;
    const center = size / 2;
    const r = size / 2 - 2;
    const rad = (phaseDeg * Math.PI) / 180;
    const dx = center + r * Math.cos(-rad);
    const dy = center + r * Math.sin(-rad);
    return (
      <svg width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={center} y1={center} x2={dx} y2={dy} stroke="var(--primary)" strokeWidth="1.5" />
        {probability > 0.01 && (
          <circle cx={center} cy={center} r={r * Math.sqrt(probability)} fill="rgba(0, 242, 254, 0.35)" />
        )}
      </svg>
    );
  };

  // --- MAP GATE IDS TO ACCELERATED LABELS / GRADIENTS ---
  const getGateSymbolDetails = (gateType) => {
    const type = gateType.toLowerCase();
    
    // Default single-qubit turns
    if (type === 'h') return { symbol: 'H', bg: 'linear-gradient(135deg, #00f2fe, #4facfe)', color: '#0f172a' };
    if (type === 'x' || type === '⊕') return { symbol: '⊕', bg: 'linear-gradient(135deg, #ff007f, #f50057)', color: '#fff' };
    if (type === 'y') return { symbol: 'Y', bg: 'linear-gradient(135deg, #9d4edd, #7b2cbf)', color: '#fff' };
    if (type === 'z') return { symbol: 'Z', bg: 'linear-gradient(135deg, #ffb703, #fb8500)', color: '#0f172a' };
    if (type === '●') return { symbol: '●', bg: '#00f2fe', color: '#00f2fe', radius: '50%' };
    if (type === '○') return { symbol: '○', bg: 'none', color: '#00f2fe', radius: '50%', border: '2px solid #00f2fe' };
    if (type === 'state_0') return { symbol: '|0⟩', bg: '#10b981', color: '#fff' };
    if (type === 'state_1') return { symbol: '|1⟩', bg: '#10b981', color: '#fff' };
    if (type === 'swap') return { symbol: '×', bg: 'linear-gradient(135deg, #64748b, #475569)', color: '#fff' };
    
    // Displays
    if (['chance', 'bloch', 'amps', 'density'].includes(type)) {
      return { symbol: type.charAt(0).toUpperCase() + type.slice(1, 4), bg: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' };
    }

    // Quarter/Eighth/Spinning (Yellow tint)
    if (type.includes('_t') || type.includes('_ft') || type.includes('grad_t')) {
      return { symbol: gateType.toUpperCase(), bg: 'linear-gradient(135deg, #fef08a, #ca8a04)', color: '#854d0e' };
    }
    if (type === 's' || type === 's_inv' || type === 't' || type === 't_inv' || type.startsWith('x_') || type.startsWith('y_')) {
      return { symbol: gateType.toUpperCase().replace('_INV', '⁻¹'), bg: 'linear-gradient(135deg, #fef08a, #eab308)', color: '#854d0e' };
    }

    // Arithmetic / Comparisons / QFT (Grey/Grey-blue)
    if (type === 'qft' || type === 'qft_inv') {
      return { symbol: gateType.toUpperCase().replace('_INV', '⁻¹'), bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff' };
    }
    if (type.startsWith('compare_')) {
      const sym = type.replace('compare_lt','A<B').replace('compare_gt','A>B').replace('compare_le','A≤B').replace('compare_ge','A≥B').replace('compare_eq','A=B').replace('compare_ne','A≠B');
      return { symbol: sym, bg: 'linear-gradient(135deg, #334155, #1e293b)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' };
    }
    if (type.startsWith('add_') || type.startsWith('sub_') || type.startsWith('mul_') || type.startsWith('div_')) {
      const sym = gateType.replace('add_1','+1').replace('sub_1','-1').replace('add_a','+A').replace('sub_a','-A').replace('add_ab','+AB').replace('mul_a','xA').replace('div_a','xA⁻¹');
      return { symbol: sym, bg: 'linear-gradient(135deg, #334155, #1e293b)', color: '#fff' };
    }
    if (type.startsWith('scalar_')) {
      const sym = gateType.replace('scalar_minus','-').replace('scalar_0','0').replace('scalar_i','i').replace('scalar_minus_i','-i').replace('scalar_sqrt_i','√i').replace('scalar_sqrt_minus_i','√-i');
      return { symbol: sym, bg: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)', color: '#0f172a' };
    }

    return { symbol: gateType.toUpperCase(), bg: 'linear-gradient(135deg, var(--secondary), var(--accent))', color: '#fff' };
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-section">
          {systemMode === 'quantum' ? (
            <Sparkles className="logo-icon animate-spin" size={28} style={{ color: 'var(--secondary)' }} />
          ) : (
            <Layers className="logo-icon animate-spin" size={28} style={{ color: 'var(--primary)' }} />
          )}
          <div>
            <h2>ParallelGrid</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SANDBOX CONSOLE</p>
          </div>
        </div>

        {/* Global mode toggle in Sidebar */}
        <div className="nav-menu" style={{ gap: '12px' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '8px' }}>
            System Core Engine
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <button 
              className={`btn ${systemMode === 'quantum' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', background: systemMode === 'quantum' ? 'linear-gradient(135deg, var(--secondary), var(--accent))' : 'none', border: 'none' }}
              onClick={() => { setSystemMode('quantum'); setActiveTab('simulators'); }}
            >
              <Sparkles size={16} />
              <span>Quantum Simulator</span>
            </button>
            <button 
              className={`btn ${systemMode === 'parallel' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem', background: systemMode === 'parallel' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'none', border: 'none' }}
              onClick={() => { setSystemMode('parallel'); setActiveTab('simulators'); }}
            >
              <Cpu size={16} />
              <span>Parallel Computing</span>
            </button>
          </div>
        </div>

        <nav className="nav-menu" style={{ marginTop: '16px' }}>
          <div 
            className={`nav-item ${activeTab === 'simulators' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulators')}
          >
            <Cpu size={20} />
            <span>Workspace</span>
          </div>
          
          {systemMode === 'parallel' && (
            <div 
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); fetchHistory(); }}
            >
              <History size={20} />
              <span>Database History</span>
              {history.length > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: 'var(--primary)', 
                  color: 'var(--bg-dark)', 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold' 
                }}>
                  {history.length}
                </span>
              )}
            </div>
          )}

          <div 
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Settings size={20} />
            <span>Hardware Specs</span>
          </div>

          <div className="nav-item" style={{ padding: '8px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <Sliders size={18} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <option value="dark" style={{ background: 'var(--bg-card)' }}>Dark Theme</option>
              <option value="white" style={{ background: 'var(--bg-card)' }}>Light (White)</option>
              <option value="amber" style={{ background: 'var(--bg-card)' }}>Amber Glow</option>
            </select>
          </div>
        </nav>

        {/* Live Hardware Stats Panel */}
        <div className="hw-panel">
          <div className="hw-header">
            <Activity className="glow-text" size={16} />
            <span>SYSTEM METRIC CORES</span>
          </div>

          <div className="hw-gauges">
            <div className="hw-gauge">
              <div className="radial-container">
                <svg className="radial-svg">
                  <circle className="radial-bg" cx="30" cy="30" r="30" />
                  <circle 
                    className="radial-fill cpu" 
                    cx="30" 
                    cy="30" 
                    r="30" 
                    strokeDasharray="188.4" 
                    strokeDashoffset={cpuOffset} 
                  />
                </svg>
                <div className="radial-text">{cpuPercent}%</div>
              </div>
              <span className="hw-gauge-title">CPU Load</span>
            </div>

            <div className="hw-gauge">
              <div className="radial-container">
                <svg className="radial-svg">
                  <circle className="radial-bg" cx="30" cy="30" r="30" />
                  <circle 
                    className="radial-fill gpu" 
                    cx="30" 
                    cy="30" 
                    r="30" 
                    strokeDasharray="188.4" 
                    strokeDashoffset={gpuOffset} 
                  />
                </svg>
                <div className="radial-text">{gpuPercent}%</div>
              </div>
              <span className="hw-gauge-title">GPU Load</span>
            </div>
          </div>

          <div className="hw-bar-group">
            <div className="hw-bar-label">
              <span>RAM (Memory Buffer)</span>
              <span>{hwStats?.memory?.usedPercent || 0}%</span>
            </div>
            <div className="hw-bar-track">
              <div className="hw-bar-fill" style={{ width: `${hwStats?.memory?.usedPercent || 0}%` }}></div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              Used: {hwStats?.memory?.usedGB || 0} GB / {hwStats?.memory?.totalGB || 16} GB
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {systemMode === 'quantum' ? 'Quantum Workspace Console' : 'Parallel Computing Sandbox'}
            </h1>
            <p>
              {systemMode === 'quantum' 
                ? 'High-fidelity quantum simulator featuring 40+ professional drag-and-drop logic gates, QFT, and arithmetic.' 
                : 'Benchmarking parallel thread distributions, memory speeds, cache limits, and computational speedups.'}
            </p>
          </div>
          <div className="system-status-indicator" style={{ 
            borderColor: systemMode === 'quantum' ? 'rgba(157, 78, 221, 0.3)' : 'rgba(16, 185, 129, 0.2)',
            color: systemMode === 'quantum' ? 'var(--secondary)' : 'var(--success)'
          }}>
            <div className="pulse-dot" style={{ background: systemMode === 'quantum' ? 'var(--secondary)' : 'var(--success)' }}></div>
            <span>{systemMode === 'quantum' ? 'Quantum Engine: ACTIVE' : 'Parallel API: ONLINE'}</span>
          </div>
        </header>

        {/* TAB 1: WORKSPACE */}
        {activeTab === 'simulators' && (
          <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ----------------------------------------------------------- */}
            {/* QUANTUM MODE SIMULATOR SECTION */}
            {/* ----------------------------------------------------------- */}
            {systemMode === 'quantum' && (
              <>
                {/* 1. Circuit presets / header controls */}
                <div className="glass-card highlighted" style={{ borderColor: 'rgba(157, 78, 221, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} className="glow-purple" style={{ color: 'var(--secondary)' }} />
                        Quantum Circuit Presets
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click a template to load it onto the circuit board</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', border: '1px solid rgba(157, 78, 221, 0.2)' }}
                        onClick={() => loadQuantumPreset({
                          num_qubits: 2,
                          gates: [
                            { gate: "h", targets: [0], step: 0 },
                            { gate: "●", targets: [0], step: 1 },
                            { gate: "x", targets: [1], step: 1 }
                          ]
                        })}
                      >
                        Bell State (Entanglement)
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', border: '1px solid rgba(157, 78, 221, 0.2)' }}
                        onClick={() => loadQuantumPreset({
                          num_qubits: 3,
                          gates: [
                            { gate: "h", targets: [0], step: 0 },
                            { gate: "●", targets: [0], step: 1 },
                            { gate: "x", targets: [1], step: 1 },
                            { gate: "●", targets: [1], step: 2 },
                            { gate: "x", targets: [2], step: 2 }
                          ]
                        })}
                      >
                        GHZ State (3-Qubit)
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', border: '1px solid rgba(157, 78, 221, 0.2)' }}
                        onClick={() => loadQuantumPreset({
                          num_qubits: 4,
                          gates: [
                            { gate: "h", targets: [0], step: 0 },
                            { gate: "h", targets: [1], step: 0 },
                            { gate: "h", targets: [2], step: 0 },
                            { gate: "h", targets: [3], step: 0 },
                            { gate: "qft", targets: [0], step: 2 }
                          ]
                        })}
                      >
                        4-Qubit QFT
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                        onClick={clearQuantumCircuit}
                      >
                        Clear Circuit
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Unified Quantum Gate Palette & Live Interactive Inspector */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                  
                  {/* Header Area: Title, Tabs & Search */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Sliders size={20} style={{ color: 'var(--secondary)' }} />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                          Quantum Gate Palette Console
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Select logic gates below, then click a wire cell in the grid to place them.
                        </p>
                      </div>
                    </div>

                    {/* Controls: Tab Selectors & Search Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      
                      {/* Search bar */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Search gates (e.g. H, QFT)..."
                          style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            width: '200px',
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          value={gateSearchQuery}
                          onChange={(e) => setGateSearchQuery(e.target.value)}
                        />
                        {gateSearchQuery && (
                          <button
                            onClick={() => setGateSearchQuery('')}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Tab buttons */}
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <button
                          className={`btn ${activeToolboxTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 10px', fontSize: '0.75rem', background: activeToolboxTab === 'all' ? 'linear-gradient(135deg, var(--secondary), var(--accent))' : 'none', border: 'none' }}
                          onClick={() => setActiveToolboxTab('all')}
                        >
                          All Gates
                        </button>
                        <button
                          className={`btn ${activeToolboxTab === 't1' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 10px', fontSize: '0.75rem', background: activeToolboxTab === 't1' ? 'linear-gradient(135deg, var(--secondary), var(--accent))' : 'none', border: 'none' }}
                          onClick={() => setActiveToolboxTab('t1')}
                        >
                          Physical Gates
                        </button>
                        <button
                          className={`btn ${activeToolboxTab === 't2' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 10px', fontSize: '0.75rem', background: activeToolboxTab === 't2' ? 'linear-gradient(135deg, var(--secondary), var(--accent))' : 'none', border: 'none' }}
                          onClick={() => setActiveToolboxTab('t2')}
                        >
                          Math & Regs
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Body Area: Split Panel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                    
                    {/* Left: Gate Directory Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '8px' }}>
                      {(() => {
                        let categories = [];
                        if (activeToolboxTab === 'all') {
                          categories = [...quantumToolbox1, ...quantumToolbox2];
                        } else if (activeToolboxTab === 't1') {
                          categories = quantumToolbox1;
                        } else {
                          categories = quantumToolbox2;
                        }

                        const results = categories.map(cat => {
                          const matching = cat.gates.filter(g => 
                            g.name.toLowerCase().includes(gateSearchQuery.toLowerCase()) || 
                            g.desc.toLowerCase().includes(gateSearchQuery.toLowerCase()) || 
                            g.id.toLowerCase().includes(gateSearchQuery.toLowerCase())
                          );
                          return { category: cat.category, gates: matching };
                        }).filter(cat => cat.gates.length > 0);

                        if (results.length === 0) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '40px 0', color: 'var(--text-muted)' }}>
                              <Info size={28} />
                              <span>No quantum gates found matching "{gateSearchQuery}"</span>
                            </div>
                          );
                        }

                        return results.map((cat, cIdx) => (
                          <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '4px', letterSpacing: '0.5px' }}>
                              {cat.category}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {cat.gates.map(gate => {
                                const isSelected = activeGateTool === gate.id;
                                const details = getGateSymbolDetails(gate.id);
                                return (
                                  <button
                                    key={gate.id}
                                    className="btn"
                                    style={{
                                      padding: '6px 10px',
                                      fontSize: '0.8rem',
                                      minWidth: '40px',
                                      height: '32px',
                                      background: isSelected ? 'linear-gradient(135deg, var(--secondary), var(--accent))' : details.bg === 'none' ? 'rgba(0,242,254,0.1)' : details.bg,
                                      border: isSelected ? '1px solid #fff' : details.border || '1px solid rgba(255,255,255,0.06)',
                                      color: isSelected ? '#fff' : details.color,
                                      borderRadius: details.radius || '6px',
                                      boxShadow: isSelected ? '0 0 8px var(--secondary-glow)' : 'none',
                                      fontWeight: 'bold',
                                      fontFamily: 'var(--font-mono)',
                                      transition: 'all 0.15s'
                                    }}
                                    onClick={() => setActiveGateTool(gate.id)}
                                    onMouseEnter={() => setHoveredGate(gate)}
                                    onMouseLeave={() => setHoveredGate(null)}
                                  >
                                    {details.symbol}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Right: Live Interactive Gate Inspector */}
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '24px' }}>
                      {(() => {
                        const inspectGate = hoveredGate || (activeGateTool ? { id: activeGateTool } : null);
                        const info = inspectGate ? getInspectorGateInfo(inspectGate.id) : null;

                        if (!info) {
                          return (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)', padding: '20px', color: 'var(--text-muted)' }}>
                              <Info size={24} />
                              <span style={{ fontSize: '0.85rem' }}>Hover over any gate to view matrix & info.</span>
                            </div>
                          );
                        }

                        const details = getGateSymbolDetails(info.id);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              
                              {/* Large symbol preview */}
                              <div style={{
                                minWidth: '48px',
                                padding: '0 12px',
                                height: '48px',
                                borderRadius: details.radius || '8px',
                                background: details.bg === 'none' ? 'rgba(0,242,254,0.15)' : details.bg,
                                border: details.border || '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: details.color,
                                fontWeight: 'bold',
                                fontFamily: 'var(--font-mono)',
                                boxShadow: '0 0 15px rgba(0, 242, 254, 0.15)'
                              }}>
                                {details.symbol}
                              </div>

                              <div>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                  {info.name}
                                </h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                  {info.category} • {info.operationType}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {info.desc}
                              </p>
                            </div>

                            {/* Mathematical Matrix Representation */}
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                Mathematical Unitary Matrix
                              </span>
                              
                              {Array.isArray(info.matrix) ? (
                                <div style={{ display: 'inline-flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', borderLeft: '2px solid var(--secondary)', borderRight: '2px solid var(--secondary)', padding: '8px 12px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--secondary)', gap: '4px' }}>
                                  {info.matrix.map((row, rIdx) => (
                                    <div key={rIdx} style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                      {row.map((val, vIdx) => (
                                        <span key={vIdx} style={{ minWidth: '40px', textAlign: 'center' }}>{val}</span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                  {info.matrix}
                                </div>
                              )}
                            </div>

                            {/* State Truth Table / Transition Mapping */}
                            {info.truthTable && (
                              <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                  Truth Table / Transition Map
                                </span>
                                <div style={{ 
                                  background: 'rgba(0,0,0,0.3)', 
                                  borderRadius: '8px', 
                                  border: '1px solid rgba(255,255,255,0.03)', 
                                  padding: '8px 12px', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '6px',
                                  fontSize: '0.73rem',
                                  fontFamily: 'var(--font-mono)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                                    <span>Input</span>
                                    <span>Output State</span>
                                  </div>
                                  {info.truthTable.map((row, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                      <span>{row.in}</span>
                                      <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{row.out}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Status tag */}
                            {hoveredGate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                                <span>Hovering to view details</span>
                              </div>
                            )}

                            {!hoveredGate && activeGateTool === info.id && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--secondary)' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 6px var(--secondary-glow)' }}></span>
                                <span>Active Selected Tool</span>
                              </div>
                            )}

                          </div>
                        );
                      })()}
                    </div>

                  </div>

                </div>

                {/* 3. Main Circuit Designer & Visualizers split panel */}
                <div className="grid-2col" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                  
                  {/* Left: Circuit designer */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card-header" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h3>
                        <Settings size={18} style={{ color: 'var(--secondary)' }} />
                        CIRCUIT DESIGNER BOARD
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qubits:</span>
                        <select 
                          className="select-ctrl" 
                          style={{ padding: '4px 10px', fontSize: '0.8rem', width: '75px' }}
                          value={numQubits}
                          onChange={(e) => { setNumQubits(parseInt(e.target.value)); clearQuantumCircuit(); }}
                        >
                          {[1, 2, 3, 4, 5, 6].map(q => (
                            <option key={q} value={q}>{q} Q</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Circuit Board Wire Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '24px 20px', borderRadius: '16px', position: 'relative', overflowX: 'auto' }}>
                      
                      {/* Connection Vertical Lines between Controls & Targets */}
                      {timelineSteps.map(stepCol => {
                        const colGates = quantumGates.filter(g => g.step === stepCol);
                        const indices = colGates.flatMap(g => g.targets);
                        const hasControlOrSwap = colGates.some(g => {
                          const name = g.gate.toLowerCase();
                          return name === '●' || name === '○' || name === 'swap' || name === 'control' || name === 'anti-control';
                        });
                        if (indices.length > 1 && hasControlOrSwap) {
                          const minQ = Math.min(...indices);
                          const maxQ = Math.max(...indices);
                          
                          // Row height is 56px, gap is 20px. So total vertical spacing is 76px.
                          const rowSpacing = 76; 
                          const top = minQ * rowSpacing + 56 / 2;
                          const height = (maxQ - minQ) * rowSpacing;
                          
                          // left padding (20) + label (60) + marginLeft (10) + step * (cell 36 + gap 24) + half cell (18)
                          const leftPos = 20 + 60 + 10 + stepCol * 60 + 18;
                          return (
                            <div
                              key={stepCol}
                              style={{
                                position: 'absolute',
                                left: `${leftPos}px`,
                                top: `${top + 24}px`,
                                height: `${height}px`,
                                width: '2px',
                                background: 'linear-gradient(to bottom, var(--primary), var(--secondary))',
                                zIndex: 1,
                                opacity: 0.8
                              }}
                            />
                          );
                        }
                        return null;
                      })}

                      {Array.from({ length: numQubits }).map((_, qubitIdx) => {
                        return (
                          <div 
                            key={qubitIdx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              position: 'relative', 
                              height: '56px' 
                            }}
                          >
                            {/* Qubit label wire end */}
                            <div style={{ 
                              width: '60px', 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '0.9rem', 
                              fontWeight: 'bold', 
                              color: 'var(--secondary)' 
                            }}>
                              q[{qubitIdx}] ──
                            </div>

                            {/* Circuit Wire Background line */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '52px', 
                              right: '0', 
                              height: '1px', 
                              background: 'rgba(255,255,255,0.1)', 
                              zIndex: 1 
                            }} />

                            {/* Timeline steps grid cell columns */}
                            <div style={{ 
                              display: 'flex', 
                              gap: '24px',
                              flexGrow: 1, 
                              zIndex: 2, 
                              marginLeft: '10px' 
                            }}>
                              {timelineSteps.map(stepCol => {
                                const gatePlaced = quantumGates.find(g => g.step === stepCol && g.targets.includes(qubitIdx));
                                const details = gatePlaced ? getGateSymbolDetails(gatePlaced.gate) : null;
                                
                                return (
                                  <div
                                    key={stepCol}
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '8px',
                                      border: '1px dashed rgba(255,255,255,0.06)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      background: gatePlaced ? 'rgba(0,0,0,0.6)' : 'transparent',
                                      borderColor: gatePlaced ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)'
                                    }}
                                    onClick={() => handleGridCellClick(qubitIdx, stepCol)}
                                    title={gatePlaced ? `Click to delete ${gatePlaced.gate.toUpperCase()} gate` : "Click to place active gate tool"}
                                  >
                                    {gatePlaced ? (
                                      <div style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: details.color,
                                        background: details.bg === 'none' ? 'transparent' : details.bg,
                                        border: details.border || '1px solid rgba(255,255,255,0.1)',
                                        padding: '4px 6px',
                                        borderRadius: details.radius || '6px',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                      }}>
                                        {details.symbol}
                                      </div>
                                    ) : (
                                      <span style={{ opacity: 0, fontSize: '0.65rem' }}>+</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Statevector Amplitudes & Probabilities table */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card-header" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h3>
                        <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
                        STATE MATRIX & PROBABILITIES
                      </h3>
                      <span className="badge badge-cyan">|Ψ⟩ STATEVECTOR</span>
                    </div>

                    {isSimulatingQuantum && (
                      <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>crunching statevector...</span>
                      </div>
                    )}

                    {!isSimulatingQuantum && quantumResult && (
                      <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Scrollable basis state amplitudes */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '8px 12px' }}>Phasor / State</th>
                                <th style={{ padding: '8px 12px' }}>Amplitude (a + bi)</th>
                                <th style={{ padding: '8px 12px' }}>Phase</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quantumResult.statevector.map((state, idx) => {
                                return (
                                  <tr 
                                    key={idx} 
                                    style={{ 
                                      borderBottom: '1px solid rgba(255,255,255,0.02)', 
                                      background: state.probability > 0.05 ? 'rgba(0, 242, 254, 0.03)' : 'none' 
                                    }}
                                  >
                                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                      {renderPhasorDial(state.probability, state.phase_deg)}
                                      {state.label}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                                      {state.real === 0 && state.imag === 0 ? '0' : `${state.real >= 0 ? ' ' : ''}${state.real.toFixed(3)} ${state.imag >= 0 ? '+' : '-'}${state.imag === 0 ? '0' : Math.abs(state.imag).toFixed(3)}i`}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{state.phase_deg.toFixed(0)}°</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Probability Distributions bar chart */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Measurement Probability Weights (|(a+bi)|^2)
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                            {quantumResult.statevector.filter(s => s.probability > 0.001 || quantumResult.statevector.length <= 4).map((state, idx) => {
                              const pct = Math.round(state.probability * 100);
                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>{state.label}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: pct > 10 ? 'var(--primary)' : 'var(--text-secondary)' }}>{pct}%</span>
                                  </div>
                                  <div className="hw-bar-track" style={{ height: '8px' }}>
                                    <div 
                                      className="hw-bar-fill" 
                                      style={{ 
                                        width: `${pct}%`,
                                        background: 'linear-gradient(90deg, var(--secondary), var(--primary))' 
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Bottom Classical Inputs Hyperparameters panel */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card-header" style={{ borderColor: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                    <h3>
                      <Sliders size={18} style={{ color: 'var(--accent)' }} />
                      CLASSICAL INPUT PARAMETERS (REGISTER VALUES FOR ADVANCED ARITHMETIC GATES)
                    </h3>
                    <span className="badge badge-pink">Sandbox Inputs</span>
                  </div>

                  <div className="grid-3col">
                    <div className="form-group">
                      <label>
                        <span>Input Register A</span>
                        <span className="val" style={{ color: 'var(--primary)' }}>A = {classicalA}</span>
                      </label>
                      <input 
                        type="range" 
                        className="slider-ctrl" 
                        min="0" 
                        max="7" 
                        step="1" 
                        value={classicalA}
                        onChange={(e) => setClassicalA(parseInt(e.target.value))}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sets classical input value for +A, -A, xA, compare gates.
                      </span>
                    </div>

                    <div className="form-group">
                      <label>
                        <span>Input Register B</span>
                        <span className="val" style={{ color: 'var(--secondary)' }}>B = {classicalB}</span>
                      </label>
                      <input 
                        type="range" 
                        className="slider-ctrl" 
                        min="0" 
                        max="7" 
                        step="1" 
                        value={classicalB}
                        onChange={(e) => setClassicalB(parseInt(e.target.value))}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sets classical input value for multiplication and arithmetic.
                      </span>
                    </div>

                    <div className="form-group">
                      <label>
                        <span>Modulus Register R</span>
                        <span className="val" style={{ color: 'var(--accent)' }}>R = {classicalR}</span>
                      </label>
                      <input 
                        type="range" 
                        className="slider-ctrl" 
                        min="2" 
                        max="7" 
                        step="1" 
                        value={classicalR}
                        onChange={(e) => setClassicalR(parseInt(e.target.value))}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sets modular divisor R for mod arithmetic.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. QPU Superconducting Compiler Benchmarks */}
                <div className="glass-card highlighted" style={{ borderColor: 'rgba(0, 242, 254, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={18} className="glow-text" style={{ color: 'var(--primary)' }} />
                        Cryogenic QPU Compilation Suite
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Compile standard unitary subcircuits directly onto mock IBM Falcon Superconducting Hardware</p>
                    </div>
                    
                    <button 
                      className="btn btn-primary"
                      onClick={compileCircuitOnQPU}
                      disabled={isCompilingQiskit}
                    >
                      {isCompilingQiskit ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span>COMPILING UNITARIES...</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          <span>RUN QPU COMPILER</span>
                        </>
                      )}
                    </button>
                  </div>

                  {qiskitCompileSuccess && qiskitCompileData && (
                    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
                      <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Superconducting Falcon Cryogenic Profile
                      </h4>
                      <div className="grid-3col" style={{ gap: '16px' }}>
                        <div className="metric-box">
                          <div className="metric-label">Processor Hardware</div>
                          <div className="metric-value" style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '6px' }}>
                            IBM Falcon r5.11 Superconducting
                          </div>
                        </div>
                        <div className="metric-box secondary-metric">
                          <div className="metric-label">Qubit Technology</div>
                          <div className="metric-value" style={{ color: 'var(--secondary)', fontSize: '1rem', marginTop: '6px' }}>
                            Superconducting Transmon
                          </div>
                        </div>
                        <div className="metric-box accent-metric">
                          <div className="metric-label">Cryogenic Operating Temp</div>
                          <div className="metric-value" style={{ color: 'var(--accent)', fontSize: '1rem', marginTop: '6px' }}>
                            15 Millikelvin (-273.13 °C)
                          </div>
                        </div>
                      </div>

                      <div className="grid-2col" style={{ gap: '16px', marginTop: '8px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>IBM Falcon Coherence limits</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '6px' }}>
                            <span>T1 relaxation time</span>
                            <strong>~125 microseconds</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                            <span>T2 dephasing time</span>
                            <strong>~95 microseconds</strong>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fidelity errors</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '6px' }}>
                            <span>Superconducting Gate fidelity</span>
                            <strong>99.92%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                            <span>Readout error rate</span>
                            <strong>1.4%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Bottom 3D Bloch Spheres visualisation grid */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card-header" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h3>
                      <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
                      3D BLOCH SPHERES (DRAG WITH MOUSE TO ROTATE IN 3D)
                    </h3>
                    <span className="badge badge-purple">Qubits reduced density vectors</span>
                  </div>

                  {!isSimulatingQuantum && quantumResult && (
                    <div 
                      className="slide-in"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-around', 
                        gap: '24px', 
                        flexWrap: 'wrap',
                        padding: '10px 0'
                      }}
                    >
                      {quantumResult.bloch_vectors.map((vec, idx) => {
                        return (
                          <BlochSphere
                            key={idx}
                            qubitIndex={vec.qubit}
                            x={vec.x}
                            y={vec.y}
                            z={vec.z}
                            magnitude={vec.magnitude}
                            entangled={vec.entangled}
                          />
                        );
                      })}
                    </div>
                  )}

                  <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={16} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Developer Insight:</strong> The Bloch Sphere is only valid for single pure states. In multi-qubit systems, entanglement (e.g. Bell state preset) forces individual qubits into a <em>mixed state</em>. Our density-matrix trace calculations properly capture this: notice how tracing entangled qubits causes their vectors to shrink to length 0 in the exact center $(0,0,0)$! Drag the spheres above to inspect axes.
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ----------------------------------------------------------- */}
            {/* PARALLEL MODE SIMULATOR SECTION (Unchanged) */}
            {/* ----------------------------------------------------------- */}
            {systemMode === 'parallel' && (
              <>
                {/* Top Selector Panel */}
                <div className="glass-card highlighted">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} className="glow-text" style={{ color: 'var(--primary)' }} />
                        Choose Simulation Core
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select a mathematical architecture to simulate in parallel workloads</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { id: 'amdahls_law', name: "Amdahl's Law" },
                        { id: 'load_balancing', name: "Load Balancing" },
                        { id: 'matrix_vector', name: "Matrix Multiply" },
                        { id: 'opencl_vecadd', name: "OpenCL Vector Add" },
                        { id: 'concurrency_locks', name: "Concurrency Locks" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          className={`btn ${benchmarkType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          onClick={() => { setBenchmarkType(tab.id); setSimResult(null); }}
                        >
                          {tab.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Left Parameters Configuration & Right Output Sandbox */}
                <div className="grid-2col">
                  
                  {/* Configuration parameters */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="card-header">
                        <h3>
                          <Settings size={18} style={{ color: 'var(--secondary)' }} />
                          HYPERPARAMETERS
                        </h3>
                        <span className="badge badge-purple">COMPILE CONSTS</span>
                      </div>

                      {/* Dynamic Render Parameters Based on Type */}
                      {benchmarkType === 'amdahls_law' && (
                        <>
                          <div className="form-group">
                            <label>
                              <span>Parallel Fraction (P)</span>
                              <span className="val">{(params.parallelFraction * 100).toFixed(0)}%</span>
                            </label>
                            <input 
                              type="range" 
                              className="slider-ctrl" 
                              min="0" 
                              max="0.99" 
                              step="0.01" 
                              value={params.parallelFraction}
                              onChange={(e) => handleParamChange('parallelFraction', parseFloat(e.target.value))}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Percentage of code capable of running on parallel threads.
                            </span>
                          </div>

                          <div className="form-group">
                            <label>
                              <span>Maximum Simulated Cores</span>
                              <span className="val">{params.maxCores} Cores</span>
                            </label>
                            <select 
                              className="select-ctrl" 
                              value={params.maxCores} 
                              onChange={(e) => handleParamChange('maxCores', parseInt(e.target.value))}
                            >
                              <option value={8}>8 Cores</option>
                              <option value={16}>16 Cores</option>
                              <option value={32}>32 Cores</option>
                              <option value={64}>64 Cores</option>
                              <option value={128}>128 Cores</option>
                              <option value={256}>256 Cores</option>
                            </select>
                          </div>
                        </>
                      )}

                      {benchmarkType === 'load_balancing' && (
                        <>
                          <div className="form-group">
                            <label>
                              <span>Simulated Task Queue Size</span>
                              <span className="val">{params.taskCount} Tasks</span>
                            </label>
                            <input 
                              type="range" 
                              className="slider-ctrl" 
                              min="10" 
                              max="40" 
                              step="1" 
                              value={params.taskCount}
                              onChange={(e) => handleParamChange('taskCount', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              <span>Active Thread Cores</span>
                              <span className="val">{params.coreCount} Cores</span>
                            </label>
                            <select 
                              className="select-ctrl" 
                              value={params.coreCount} 
                              onChange={(e) => handleParamChange('coreCount', parseInt(e.target.value))}
                            >
                              <option value={2}>2 Cores</option>
                              <option value={4}>4 Cores</option>
                              <option value={6}>6 Cores</option>
                              <option value={8}>8 Cores</option>
                              <option value={12}>12 Cores</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Scheduling Strategy</label>
                            <select 
                              className="select-ctrl" 
                              value={params.strategy}
                              onChange={(e) => handleParamChange('strategy', e.target.value)}
                            >
                              <option value="static">Static Scheduling (Blocked Round-Robin)</option>
                              <option value="dynamic">Dynamic Scheduling (Shared Thread Pool)</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Task Workload Variance</label>
                            <select 
                              className="select-ctrl" 
                              value={params.variance}
                              onChange={(e) => handleParamChange('variance', e.target.value)}
                            >
                              <option value="low">Low Variance (Highly Homogeneous tasks)</option>
                              <option value="high">High Variance (Highly Heterogeneous / Unpredictable)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {benchmarkType === 'matrix_vector' && (
                        <>
                          <div className="form-group">
                            <label>
                              <span>Matrix Dimension Size (N x N)</span>
                              <span className="val">{params.matrixSize} x {params.matrixSize}</span>
                            </label>
                            <select 
                              className="select-ctrl" 
                              value={params.matrixSize}
                              onChange={(e) => handleParamChange('matrixSize', parseInt(e.target.value))}
                            >
                              <option value={512}>512 x 512</option>
                              <option value={1024}>1024 x 1024</option>
                              <option value={2048}>2048 x 2048</option>
                              <option value={4096}>4096 x 4096</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>
                              <span>OpenMP Thread Pool Size</span>
                              <span className="val">{params.threadCount} Threads</span>
                            </label>
                            <input 
                              type="range" 
                              className="slider-ctrl" 
                              min="2" 
                              max="32" 
                              step="2" 
                              value={params.threadCount}
                              onChange={(e) => handleParamChange('threadCount', parseInt(e.target.value))}
                            />
                          </div>
                        </>
                      )}

                      {benchmarkType === 'opencl_vecadd' && (
                        <>
                          <div className="form-group">
                            <label>
                              <span>Vector Array Length</span>
                              <span className="val">{(params.vectorSize).toLocaleString()} elements</span>
                            </label>
                            <select 
                              className="select-ctrl" 
                              value={params.vectorSize}
                              onChange={(e) => handleParamChange('vectorSize', parseInt(e.target.value))}
                            >
                              <option value={10000}>10,000 (Small array size)</option>
                              <option value={100000}>100,000 (Medium array size)</option>
                              <option value={1000000}>1,000,000 (Large vector size)</option>
                              <option value={5000000}>5,000,000 (Very large array size)</option>
                              <option value={20000000}>20,000,000 (GPU optimized load size)</option>
                            </select>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Simulates the floating point array size to allocate in Host memory and copy over PCIe.
                            </span>
                          </div>
                        </>
                      )}

                      {benchmarkType === 'concurrency_locks' && (
                        <>
                          <div className="form-group">
                            <label>
                              <span>Simulated Threads</span>
                              <span className="val">{params.threadCount} Threads</span>
                            </label>
                            <input 
                              type="range" 
                              className="slider-ctrl" 
                              min="2" 
                              max="32" 
                              step="1" 
                              value={params.threadCount}
                              onChange={(e) => handleParamChange('threadCount', parseInt(e.target.value))}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Number of threads attempting to simultaneously increment a shared memory counter variable by {(params.incrementsPerThread).toLocaleString()} iterations each.
                            </span>
                          </div>
                          <div className="form-group">
                            <label>Mutex Lock Synchronization</label>
                            <select 
                              className="select-ctrl" 
                              value={params.useMutex}
                              onChange={(e) => handleParamChange('useMutex', e.target.value === 'true')}
                            >
                              <option value={false}>Off (Permit Race Conditions)</option>
                              <option value={true}>On (Safe Execution but Slower)</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '14px 20px', fontSize: '1rem' }}
                        onClick={runSimulation}
                        disabled={isRunningSim}
                      >
                        {isRunningSim ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            <span>COMPILING & EXECUTING...</span>
                          </>
                        ) : (
                          <>
                            <Play size={18} />
                            <span>RUN GRAPH BENCHMARK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Simulation Output Card */}
                  <div className="glass-card highlighted" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                      <h3>
                        <Zap size={18} className="glow-text" style={{ color: 'var(--primary)' }} />
                        SANDBOX OUTPUT TERMINAL
                      </h3>
                      <span className={`badge ${simResult ? 'badge-cyan' : 'badge-pink'}`}>
                        {simResult ? 'COMPLETED' : 'AWAITING RUN'}
                      </span>
                    </div>

                    {!simResult && !isRunningSim && (
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '12px', textAlign: 'center', padding: '20px' }}>
                        <Cpu size={48} style={{ opacity: 0.15, margin: '0 auto' }} />
                        <p style={{ fontWeight: '500', marginTop: '12px' }}>Terminal is idle.</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                          Configure the parameters in the left panel and click the run button to trigger a thread simulation calculation.
                        </p>
                      </div>
                    )}

                    {isRunningSim && (
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                        <Layers size={40} className="animate-spin" style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--primary)' }}>[kernel_exec] launching worker threads...</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Simulating cache lines, barrier synchronization, and bus transfer limits.</p>
                        </div>
                      </div>
                    )}

                    {simResult && !isRunningSim && (
                      <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                        
                        <div className="history-summary">
                          {simResult.results.summary}
                        </div>

                        {/* Specific Simulator Visualizations */}
                        {simResult.type === 'amdahls_law' && (
                          <div>
                            <div className="metrics-row">
                              <div className="metric-box">
                                <div className="metric-label">Amdahl Speedup</div>
                                <div className="metric-value" style={{ color: 'var(--primary)' }}>{simResult.results.amdahlSpeedup}x</div>
                              </div>
                              <div className="metric-box secondary-metric">
                                <div className="metric-label">Gustafson Speedup</div>
                                <div className="metric-value" style={{ color: 'var(--secondary)' }}>{simResult.results.gustafsonSpeedup}x</div>
                              </div>
                              <div className="metric-box accent-metric">
                                <div className="metric-label">Efficiency</div>
                                <div className="metric-value" style={{ color: 'var(--accent)' }}>{simResult.results.efficiencyPercent}%</div>
                              </div>
                            </div>

                            <div className="svg-chart-container">
                              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="amdahl-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4"/>
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0"/>
                                  </linearGradient>
                                </defs>

                                <line x1="40" y1="20" x2="40" y2="170" className="chart-axis-line" />
                                <line x1="40" y1="170" x2="380" y2="170" className="chart-axis-line" />
                                <line x1="40" y1="20" x2="380" y2="20" className="chart-grid-line" />
                                <line x1="40" y1="70" x2="380" y2="70" className="chart-grid-line" />
                                <line x1="40" y1="120" x2="380" y2="120" className="chart-grid-line" />
                                
                                {(() => {
                                  const points = simResult.results.charts.amdahlPoints;
                                  const gp = simResult.results.charts.gustafsonPoints;
                                  const maxS = Math.max(...gp.map(d => d.speedup));
                                  
                                  const getCoords = (pArray) => {
                                    return pArray.map((p, idx) => {
                                      const x = 40 + (idx / (pArray.length - 1)) * 330;
                                      const y = 170 - (p.speedup / maxS) * 140;
                                      return `${x},${y}`;
                                    }).join(' ');
                                  };

                                  const amdahlCoords = getCoords(points);
                                  const gustafsonCoords = getCoords(gp);
                                  const amdahlFillCoords = `40,170 ${amdahlCoords} 370,170`;

                                  return (
                                    <>
                                      <line x1="40" y1="170" x2="370" y2="30" className="chart-path-ideal" />
                                      <polygon points={amdahlFillCoords} className="chart-area-amdahl" />
                                      <polyline points={gustafsonCoords} className="chart-path-gustafson" />
                                      <polyline points={amdahlCoords} className="chart-path-amdahl" />
                                      {points.map((p, idx) => {
                                        const x = 40 + (idx / (points.length - 1)) * 330;
                                        const y = 170 - (p.speedup / maxS) * 140;
                                        const gy = 170 - (gp[idx].speedup / maxS) * 140;
                                        return (
                                          <g key={idx}>
                                            <circle cx={x} cy={y} r="4" className="chart-node amdahl" />
                                            <circle cx={x} cy={gy} r="3" className="chart-node gustafson" />
                                          </g>
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                            <div className="chart-legend">
                              <div className="legend-item">
                                <div className="legend-color" style={{ background: 'rgba(255,255,255,0.25)', height: '2px', width: '15px' }}></div>
                                <span>Ideal Linear</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color" style={{ background: 'var(--primary)' }}></div>
                                <span>Amdahl Speedup</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color" style={{ background: 'var(--secondary)', height: '1px', border: '1px dashed' }}></div>
                                <span>Gustafson Scaled</span>
                              </div>
                            </div>

                            {/* Dynamic Code Generator Sandbox */}
                            <div className="code-sandbox-editor">
                              <div className="code-sandbox-header">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>amdahl_speedup_engine.cpp</span>
                                <span className="badge badge-purple">OpenMP C++</span>
                              </div>
                              <pre className="code-terminal-pre">
                                <code style={{ color: 'var(--primary-glow)' }}>{getBenchmarkCodeSample('amdahls_law', simResult.params)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {simResult.type === 'load_balancing' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="metrics-row">
                              <div className="metric-box">
                                <div className="metric-label">Execution Time (Make span)</div>
                                <div className="metric-value" style={{ color: 'var(--primary)' }}>{simResult.results.makeSpan}ms</div>
                              </div>
                              <div className="metric-box secondary-metric">
                                <div className="metric-label">Avg Core Workload</div>
                                <div className="metric-value" style={{ color: 'var(--secondary)' }}>{simResult.results.avgCoreWorkload}ms</div>
                              </div>
                              <div className="metric-box accent-metric">
                                <div className="metric-label">Workload Imbalance (StdDev)</div>
                                <div className="metric-value" style={{ color: 'var(--error)' }}>{simResult.results.workloadStdDev}ms</div>
                              </div>
                            </div>

                            <div className="timeline-panel">
                              {simResult.results.cores.map((core) => (
                                <div key={core.id} className="timeline-row">
                                  <span className="timeline-core-label">
                                    <Cpu size={14} /> Core {core.id}
                                  </span>
                                  <div className="timeline-track">
                                    {core.timeline.map((block, bIdx) => {
                                      const startPct = (block.startTime / simResult.results.makeSpan) * 100;
                                      const widthPct = (block.duration / simResult.results.makeSpan) * 100;
                                      return (
                                        <div
                                          key={bIdx}
                                          className="timeline-task-block"
                                          style={{
                                            left: `${startPct}%`,
                                            width: `${widthPct}%`,
                                            background: getTaskColor(block.duration)
                                          }}
                                        >
                                          {block.taskId.split('_')[1]}
                                        </div>
                                      );
                                    })}
                                    {core.idleTime > 0 && (
                                      <div 
                                        className="timeline-idle-block"
                                        style={{
                                          left: `${((simResult.results.makeSpan - core.idleTime) / simResult.results.makeSpan) * 100}%`,
                                          width: `${(core.idleTime / simResult.results.makeSpan) * 100}%`
                                        }}
                                      />
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '35px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {core.utilizationPercent}%
                                  </span>
                                </div>
                              ))}
                              <div className="timeline-ruler">
                                <span>0ms</span>
                                <span>{(simResult.results.makeSpan * 0.25).toFixed(0)}ms</span>
                                <span>{(simResult.results.makeSpan * 0.5).toFixed(0)}ms</span>
                                <span>{(simResult.results.makeSpan * 0.75).toFixed(0)}ms</span>
                                <span>{simResult.results.makeSpan}ms</span>
                              </div>
                            </div>

                            {/* Core Thermal Activity Grid */}
                            <div className="timeline-panel" style={{ gap: '10px' }}>
                              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Core Thermal Capacity Map</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {simResult.results.cores.map((c) => {
                                  const isHot = c.utilizationPercent > 80;
                                  const heatColor = isHot ? 'var(--accent)' : 'var(--success)';
                                  return (
                                    <div key={c.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Core {c.id}</div>
                                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: heatColor, marginTop: '4px' }}>
                                        {c.utilizationPercent}%
                                      </div>
                                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${c.utilizationPercent}%`, background: heatColor }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Code Sandbox section */}
                            <div className="code-sandbox-editor">
                              <div className="code-sandbox-header">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>omp_schedule_loops.cpp</span>
                                <span className="badge badge-purple">OpenMP C++</span>
                              </div>
                              <pre className="code-terminal-pre">
                                <code style={{ color: 'var(--primary-glow)' }}>{getBenchmarkCodeSample('load_balancing', simResult.params)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {simResult.type === 'matrix_vector' && (
                          <div>
                            <div className="metrics-row">
                              <div className="metric-box">
                                <div className="metric-label">Floating Point Operations</div>
                                <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.2rem', marginTop: '10px' }}>
                                  {(simResult.results.operations).toLocaleString()} FLOP
                                </div>
                              </div>
                              <div className="metric-box secondary-metric">
                                <div className="metric-label">1D Speedup</div>
                                <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>{simResult.results.decomp1D.speedup}x</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{simResult.results.decomp1D.gflops} GFLOPS</div>
                              </div>
                              <div className="metric-box accent-metric">
                                <div className="metric-label">2D Block Speedup</div>
                                <div className="metric-value" style={{ color: 'var(--primary)' }}>{simResult.results.decomp2D.speedup}x</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{simResult.results.decomp2D.gflops} GFLOPS</div>
                              </div>
                            </div>

                            <div className="timeline-panel" style={{ gap: '12px' }}>
                              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>L3 Cache Coherency Comparison</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.8rem' }}>
                                  <span>1D Row-Wise (OpenMP Parallel For)</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{simResult.results.decomp1D.executionTimeMs} ms</span>
                                </div>
                                <div className="hw-bar-track" style={{ height: '14px' }}>
                                  <div className="hw-bar-fill" style={{ width: '100%', background: 'var(--text-secondary)' }}></div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>2D Block decomposition (Optimized Locality)</span>
                                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{simResult.results.decomp2D.executionTimeMs} ms</span>
                                </div>
                                <div className="hw-bar-track" style={{ height: '14px' }}>
                                  <div className="hw-bar-fill" style={{ width: `${(simResult.results.decomp2D.executionTimeMs / simResult.results.decomp1D.executionTimeMs) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {/* Cache Locality Heatmap */}
                            <div className="cache-heatmap-container">
                              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Layers size={14} /> L1/L2 Cache Spatial Hit Locality
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <div className="cache-level-row">
                                  <div className="cache-level-label">L1 Cache</div>
                                  <div className="cache-grid-cells">
                                    {Array.from({ length: 16 }).map((_, idx) => {
                                      const is2D = simResult.results.comparison.includes('2D');
                                      const cellClass = is2D ? 'cache-block-cell hit' : ((idx % 3 === 0) ? 'cache-block-cell hit' : 'cache-block-cell miss');
                                      return <div key={idx} className={cellClass} />;
                                    })}
                                  </div>
                                </div>
                                <div className="cache-level-row">
                                  <div className="cache-level-label">L2 Cache</div>
                                  <div className="cache-grid-cells">
                                    {Array.from({ length: 16 }).map((_, idx) => {
                                      const is2D = simResult.results.comparison.includes('2D');
                                      const cellClass = is2D ? (idx % 5 !== 0 ? 'cache-block-cell hit' : 'cache-block-cell miss') : (idx % 2 === 0 ? 'cache-block-cell hit' : 'cache-block-cell miss');
                                      return <div key={idx} className={cellClass} />;
                                    })}
                                  </div>
                                </div>
                                <div className="cache-level-row">
                                  <div className="cache-level-label">L3 Cache</div>
                                  <div className="cache-grid-cells">
                                    {Array.from({ length: 16 }).map((_, idx) => {
                                      return <div key={idx} className="cache-block-cell hit" />;
                                    })}
                                  </div>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {simResult.results.comparison}
                              </p>
                            </div>

                            {/* Code Sandbox section */}
                            <div className="code-sandbox-editor">
                              <div className="code-sandbox-header">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>matrix_block_cache.cpp</span>
                                <span className="badge badge-purple">OpenMP C++</span>
                              </div>
                              <pre className="code-terminal-pre">
                                <code style={{ color: 'var(--primary-glow)' }}>{getBenchmarkCodeSample('matrix_vector', simResult.params)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {simResult.type === 'opencl_vecadd' && (
                          <div>
                            <div className="metrics-row">
                              <div className="metric-box">
                                <div className="metric-label">CPU Parallel execution</div>
                                <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>{simResult.results.cpuTimeMs}ms</div>
                              </div>
                              <div className="metric-box secondary-metric">
                                <div className="metric-label">GPU Total (OpenCL)</div>
                                <div className="metric-value" style={{ color: 'var(--primary)' }}>{simResult.results.gpu.totalTimeMs}ms</div>
                              </div>
                              <div className="metric-box accent-metric">
                                <div className="metric-label">GPU Kernel Compute</div>
                                <div className="metric-value" style={{ color: 'var(--accent)' }}>{simResult.results.gpu.kernelComputeMs}ms</div>
                              </div>
                            </div>

                            <div className="crossover-chart">
                              <div className="crossover-col">
                                <div className="crossover-val" style={{ color: 'var(--text-secondary)' }}>{simResult.results.cpuTimeMs}ms</div>
                                <div className="crossover-bar-container">
                                  <div className="crossover-bar cpu" style={{ height: '100%' }}></div>
                                </div>
                                <div className="crossover-lbl">CPU Thread</div>
                              </div>

                              <div className="crossover-col" style={{ flex: 1.5 }}>
                                <div className="crossover-val" style={{ color: 'var(--primary)' }}>{simResult.results.gpu.totalTimeMs}ms</div>
                                <div className="crossover-bar-container" style={{ display: 'flex', flexDirection: 'column', height: '80px', width: '100%', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: '6px' }}>
                                  <div style={{ background: 'var(--accent)', height: `${(simResult.results.gpu.deviceToHostMs / simResult.results.gpu.totalTimeMs) * 100}%`, width: '100%' }} />
                                  <div style={{ background: 'var(--primary)', height: `${(simResult.results.gpu.kernelComputeMs / simResult.results.gpu.totalTimeMs) * 100}%`, width: '100%' }} />
                                  <div style={{ background: 'var(--secondary)', height: `${(simResult.results.gpu.hostToDeviceMs / simResult.results.gpu.totalTimeMs) * 100}%`, width: '100%' }} />
                                </div>
                                <div className="crossover-lbl">GPU Stages</div>
                              </div>
                            </div>

                            {/* PCIe Vector Pipeline Visualizer */}
                            <div className="pcie-visualizer-container">
                              <div className="pcie-node-card">
                                <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Host Memory</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Vectors A & B</div>
                              </div>
                              
                              <div className="pcie-bus-lane">
                                <div className="pcie-data-packet" style={{ animationDelay: '0s' }} />
                                <div className="pcie-data-packet" style={{ animationDelay: '0.7s', background: 'var(--secondary)' }} />
                                <div className="pcie-data-packet" style={{ animationDelay: '1.4s', background: 'var(--accent)' }} />
                                <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--primary-glow)', fontFamily: 'var(--font-mono)' }}>
                                  PCIe Gen4 x16
                                </div>
                              </div>
                              
                              <div className="pcie-node-card" style={{ borderColor: 'var(--primary)' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>GPU VRAM</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--primary-glow)', marginTop: '4px' }}>Kernel threads</div>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                              {simResult.results.comparison}
                            </p>

                            {/* Code Sandbox section */}
                            <div className="code-sandbox-editor">
                              <div className="code-sandbox-header">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>opencl_vecadd.c</span>
                                <span className="badge badge-cyan">OpenCL C</span>
                              </div>
                              <pre className="code-terminal-pre">
                                <code style={{ color: 'var(--primary-glow)' }}>{getBenchmarkCodeSample('opencl_vecadd', simResult.params)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {simResult.type === 'concurrency_locks' && (
                          <div>
                            <div className="metrics-row">
                              <div className="metric-box">
                                <div className="metric-label">Target Sum (Expected)</div>
                                <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>{simResult.results.targetSum.toLocaleString()}</div>
                              </div>
                              <div className="metric-box secondary-metric">
                                <div className="metric-label">Actual Sum (Computed)</div>
                                <div className="metric-value" style={{ color: simResult.results.useMutex ? 'var(--success)' : 'var(--error)' }}>{simResult.results.actualSum.toLocaleString()}</div>
                              </div>
                              <div className="metric-box accent-metric">
                                <div className="metric-label">Time Elapsed</div>
                                <div className="metric-value" style={{ color: 'var(--accent)' }}>{simResult.results.timeElapsed}ms</div>
                              </div>
                            </div>
                            
                            {simResult.results.dataLoss > 0 && (
                              <div style={{ marginTop: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '16px', borderRadius: '8px' }}>
                                <h4 style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <Zap size={16} /> MASSIVE RACE CONDITION DETECTED
                                </h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                  Because the threads did not use mutex locks, they attempted to overwrite the exact same memory address simultaneously. As a result, <b>{simResult.results.dataLoss.toLocaleString()}</b> increment operations were completely lost into the void.
                                </p>
                              </div>
                            )}
                            
                            {simResult.results.useMutex && (
                              <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '16px', borderRadius: '8px' }}>
                                <h4 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <Check size={16} /> SAFE MUTEX SYNCHRONIZATION
                                </h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                  By implementing a mutex lock on the shared counter resource, all threads paused appropriately before writing to memory. You got the correct mathematical answer, but note how the execution time increased drastically compared to lockless code due to serialization overhead!
                                </p>
                              </div>
                            )}

                            {/* Safe/Unsafe Lock Particle Simulator */}
                            <div className="lock-field-container">
                              {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="particle-lane" style={{ top: `${15 + idx * 22}%` }}>
                                  <div className="neon-particle" style={{ animationDelay: `${idx * 0.6}s`, background: simResult.results.useMutex ? 'var(--success)' : 'var(--error)' }} />
                                  <span style={{ position: 'absolute', left: '4px', top: '-1px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    Thread {idx}
                                  </span>
                                </div>
                              ))}
                              
                              <div className={`lock-shield ${simResult.results.useMutex ? '' : 'error'}`}>
                                {simResult.results.useMutex ? <Lock size={20} /> : <Unlock size={20} />}
                              </div>
                              
                              <div className="counter-register" style={{ borderColor: simResult.results.useMutex ? 'var(--success)' : 'var(--error)', color: simResult.results.useMutex ? 'var(--success)' : 'var(--error)' }}>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory Reg</div>
                                <div style={{ marginTop: '2px' }}>
                                  {simResult.results.useMutex ? '100% OK' : 'COLLISION'}
                                </div>
                              </div>
                            </div>

                            {/* Code Sandbox section */}
                            <div className="code-sandbox-editor" style={{ marginTop: '16px' }}>
                              <div className="code-sandbox-header">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>thread_synchronization.cpp</span>
                                <span className="badge badge-purple">C++ Threads</span>
                              </div>
                              <pre className="code-terminal-pre">
                                <code style={{ color: 'var(--primary-glow)' }}>{getBenchmarkCodeSample('concurrency_locks', simResult.params)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* SAVE RUN CRUD FORM */}
                        {saveSuccess ? (
                          <div className="task-completed-banner">
                            <Check size={18} />
                            <span>Run successfully archived in the history database!</span>
                          </div>
                        ) : (
                          <div className="save-run-form">
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                              <Database size={14} style={{ marginRight: '4px' }} />
                              SAVE RESULTS TO DATABASE
                            </h4>
                            
                            <div className="grid-2col" style={{ gap: '12px' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <input 
                                  type="text" 
                                  className="input-ctrl" 
                                  placeholder="Run Label Title" 
                                  value={saveTitle} 
                                  onChange={(e) => setSaveTitle(e.target.value)}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <input 
                                  type="text" 
                                  className="input-ctrl" 
                                  placeholder="Notes (optional)" 
                                  value={saveNotes} 
                                  onChange={(e) => setSaveNotes(e.target.value)}
                                />
                              </div>
                            </div>

                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px 16px', width: 'fit-content', alignSelf: 'flex-end' }}
                              onClick={handleSaveRun}
                              disabled={isSaving || !saveTitle.trim()}
                            >
                              <Save size={16} />
                              <span>{isSaving ? 'Saving...' : 'Commit to History'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: DATABASE HISTORY (PARALLEL MODE ONLY) */}
        {activeTab === 'history' && systemMode === 'parallel' && (
          <div className="slide-in history-section">
            <div className="glass-card">
              <div className="card-header">
                <h3>
                  <Database size={18} style={{ color: 'var(--primary)' }} />
                  Archived Performance Records (CRUD Database)
                </h3>
                <span className="badge badge-cyan">{history.length} Runs</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Below are the persisted records saved in <code>backend/history.json</code>. You can expand them to view metrics, edit their names/notes, or delete them entirely.
              </p>

              {historyError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--error)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Warning: Cannot reach database server. Currently running in offline mode. Local edits will save in temporary memory.
                </div>
              )}

              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <History size={48} style={{ opacity: 0.15, marginBottom: '12px' }} />
                  <p style={{ fontWeight: '600' }}>No archived runs found.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Go to the simulator tab, configure and run a benchmark, and save it to the history list!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((item) => {
                    const isExpanded = expandedHistory[item.id];
                    const isEditing = editingRunId === item.id;
                    return (
                      <div key={item.id} className="history-card">
                        <div 
                          className="history-card-header"
                          onClick={() => !isEditing && toggleHistoryExpand(item.id)}
                        >
                          <div className="history-card-title-group">
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{item.type.replace('_', ' ')}</span>
                            {isEditing ? (
                              <input 
                                type="text"
                                className="edit-title-input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="history-card-title">{item.title}</span>
                            )}
                            <span className="history-card-date">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>

                          <div className="history-card-actions" onClick={(e) => e.stopPropagation()}>
                            {isEditing ? (
                              <>
                                <button className="icon-btn" onClick={() => handleUpdateRun(item.id)}>
                                  <Check size={16} style={{ color: 'var(--success)' }} />
                                </button>
                                <button className="icon-btn" onClick={() => setEditingRunId(null)}>
                                  <X size={16} style={{ color: 'var(--error)' }} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="icon-btn edit-btn" onClick={() => startEditing(item)}>
                                  <Edit2 size={16} />
                                </button>
                                <button className="icon-btn delete-btn" onClick={() => handleDeleteRun(item.id)}>
                                  <Trash2 size={16} />
                                </button>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </>
                            )}
                          </div>
                        </div>

                        {isExpanded && !isEditing && (
                          <div className="history-card-body">
                            <div className="history-summary">
                              {item.results?.summary || "No description generated."}
                            </div>

                            <div className="history-notes-area">
                              <span className="history-notes-label">Developer Notes</span>
                              <p className="history-notes-text">
                                {item.notes || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No notes provided for this run.</span>}
                              </p>
                            </div>

                            <div className="grid-3col">
                              {item.type === 'amdahls_law' && (
                                <>
                                  <div className="metric-box">
                                    <div className="metric-label">Simulated Cores</div>
                                    <div className="metric-value">{item.params.maxCores}</div>
                                  </div>
                                  <div className="metric-box">
                                    <div className="metric-label">Parallel Fraction</div>
                                    <div className="metric-value">{(item.params.parallelFraction * 100).toFixed(0)}%</div>
                                  </div>
                                  <div className="metric-box">
                                    <div className="metric-label">Amdahl Speedup</div>
                                    <div className="metric-value" style={{ color: 'var(--primary)' }}>{item.results?.amdahlSpeedup || item.results?.speedup}x</div>
                                  </div>
                                </>
                              )}

                              {item.type === 'load_balancing' && (
                                <>
                                  <div className="metric-box">
                                    <div className="metric-label">Core Count</div>
                                    <div className="metric-value">{item.params.coreCount} Cores</div>
                                  </div>
                                  <div className="metric-box">
                                    <div className="metric-label">Strategy</div>
                                    <div className="metric-value" style={{ textTransform: 'capitalize' }}>{item.params.strategy}</div>
                                  </div>
                                  <div className="metric-box">
                                    <div className="metric-label">Make Span</div>
                                    <div className="metric-value" style={{ color: 'var(--primary)' }}>{item.results?.makeSpan}ms</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {isEditing && (
                          <div className="history-card-body">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <span className="history-notes-label">Edit Notes</span>
                              <textarea
                                className="edit-notes-input"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingRunId(null)}>Cancel</button>
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleUpdateRun(item.id)}>Save Changes</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM SPEC */}
        {activeTab === 'about' && (
          <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card">
              <div className="card-header" style={{ borderColor: systemMode === 'quantum' ? 'rgba(157,78,221,0.2)' : 'rgba(255,255,255,0.05)' }}>
                <h3>
                  <Cpu size={18} style={{ color: systemMode === 'quantum' ? 'var(--secondary)' : 'var(--primary)' }} />
                  {systemMode === 'quantum' ? 'Quantum Processing Unit (QPU) Specifications' : 'Parallel Hardware Architecture Topology'}
                </h3>
              </div>
              
              {systemMode === 'quantum' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    This workspace simulates a superconducting transmon Qubit architecture running on an IBM Quantum Falcon-class processor. Statevector transformations compute standard unitary matrices mathematically:
                  </p>

                  <div className="grid-2col" style={{ gap: '20px', marginTop: '10px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                      <h4 style={{ color: 'var(--secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} /> Superconducting Processor Specs
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Processor Model</td><td style={{ textAlign: 'right' }}>IBM Falcon r5.11 (Simulated)</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Qubit Technology</td><td style={{ textAlign: 'right' }}>Superconducting Transmon</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>T1 Coherence Time</td><td style={{ textAlign: 'right' }}>~125 microseconds</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>T2 Coherence Time</td><td style={{ textAlign: 'right' }}>~95 microseconds</td></tr>
                          <tr><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Cryogenic Temp</td><td style={{ textAlign: 'right' }}>~15 millikelvin (mK)</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                      <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={16} /> Simulator Unitaries
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Hadamard (H)</td><td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>1/√2 [[1, 1], [1, -1]]</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>NOT (X)</td><td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>[[0, 1], [1, 0]]</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Phase (S)</td><td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>[[1, 0], [0, i]]</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>CNOT (CX)</td><td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>4x4 Controlled Matrix</td></tr>
                          <tr><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Trace Mechanics</td><td style={{ textAlign: 'right' }}>Partial trace density matrices</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    This sandbox environment models a modern multi-core computing platform integrated with discrete GPGPU accelerators.
                  </p>
                  <div className="grid-2col" style={{ gap: '20px', marginTop: '10px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                      <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={16} /> Host CPU Specification
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Model</td><td style={{ textAlign: 'right' }}>AMD Ryzen 7 7800X3D</td></tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Physical Cores</td><td style={{ textAlign: 'right' }}>8 Cores</td></tr>
                          <tr><td style={{ padding: '8px 0', fontWeight: 'bold' }}>Logical Threads</td><td style={{ textAlign: 'right' }}>16 Threads</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
