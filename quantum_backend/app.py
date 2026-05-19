import os
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# Modern Qiskit Imports
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 5001))

@app.route('/api/quantum/simulate', methods=['POST'])
def simulate_circuit():
    try:
        data = request.json or {}
        num_qubits = int(data.get("num_qubits", 2))
        gates = data.get("gates", [])

        # Bound check qubits
        if num_qubits < 1 or num_qubits > 6:
            return jsonify({"error": "Number of qubits must be between 1 and 6"}), 400

        # Construct modern Quantum Circuit
        qc = QuantumCircuit(num_qubits)
        
        # Track steps for visual timeline
        circuit_steps = []

        for idx, op in enumerate(gates):
            gate_type = op.get("gate", "").lower()
            targets = op.get("targets", [])
            params = op.get("params", {})
            
            # Target bound checks
            if not targets or any(t < 0 or t >= num_qubits for t in targets):
                return jsonify({"error": f"Invalid gate target indices in step {idx}: {targets}"}), 400

            # Map gates to Qiskit calls
            if gate_type == 'h':
                qc.h(targets[0])
            elif gate_type == 'x':
                qc.x(targets[0])
            elif gate_type == 'y':
                qc.y(targets[0])
            elif gate_type == 'z':
                qc.z(targets[0])
            elif gate_type == 's':
                qc.s(targets[0])
            elif gate_type == 't':
                qc.t(targets[0])
            elif gate_type == 'cx' or gate_type == 'cnot':
                if len(targets) < 2:
                    return jsonify({"error": "CNOT gate requires control and target qubits"}), 400
                qc.cx(targets[0], targets[1])
            elif gate_type == 'cz':
                if len(targets) < 2:
                    return jsonify({"error": "CZ gate requires control and target qubits"}), 400
                qc.cz(targets[0], targets[1])
            elif gate_type == 'swap':
                if len(targets) < 2:
                    return jsonify({"error": "SWAP gate requires two target qubits"}), 400
                qc.swap(targets[0], targets[1])
            elif gate_type == 'rx':
                theta = float(params.get("theta", 0))
                qc.rx(theta, targets[0])
            elif gate_type == 'ry':
                theta = float(params.get("theta", 0))
                qc.ry(theta, targets[0])
            elif gate_type == 'rz':
                theta = float(params.get("theta", 0))
                qc.rz(theta, targets[0])
            else:
                return jsonify({"error": f"Unsupported quantum gate: {gate_type}"}), 400
            
            circuit_steps.append({
                "id": f"step_{idx}",
                "gate": gate_type,
                "targets": targets,
                "params": params
            })

        # Calculate Statevector
        sv = Statevector.from_instruction(qc)
        
        # Get raw complex numbers from statevector
        raw_data = sv.data
        statevector_results = []
        
        # Construct probability and amplitude distributions
        for i, val in enumerate(raw_data):
            # Binary label (padded to num_qubits)
            label = format(i, f'0{num_qubits}b')
            real = float(val.real)
            imag = float(val.imag)
            prob = float(abs(val) ** 2)
            phase = float(np.angle(val)) # phase in radians
            
            statevector_results.append({
                "label": f"|{label}>",
                "real": round(real, 5),
                "imag": round(imag, 5),
                "probability": round(prob, 5),
                "phase_rad": round(phase, 5),
                "phase_deg": round(math.degrees(phase), 1)
            })

        # Compute Bloch coordinates for EACH qubit using density matrix partial traces
        bloch_coordinates = []
        for i in range(num_qubits):
            # Trace out all qubits except qubit i
            q_sys = [j for j in range(num_qubits) if j != i]
            rho = partial_trace(sv, q_sys)
            
            # density matrix rho = [[rho_00, rho_01], [rho_10, rho_11]]
            # x = 2 * Real(rho_01)
            # y = -2 * Imag(rho_01) (Since Qiskit uses modern standard representation)
            # z = Real(rho_00 - rho_11)
            rho_data = rho.data
            rho_00 = rho_data[0][0]
            rho_11 = rho_data[1][1]
            rho_01 = rho_data[0][1]
            
            x = float(2 * rho_01.real)
            y = float(-2 * rho_01.imag)
            z = float(rho_00.real - rho_11.real)
            
            # Bloch coordinates vector length (shows mixedness / entanglement decay)
            vec_len = math.sqrt(x**2 + y**2 + z**2)

            bloch_coordinates.append({
                "qubit": i,
                "x": round(x, 5),
                "y": round(y, 5),
                "z": round(z, 5),
                "magnitude": round(vec_len, 5),
                "entangled": vec_len < 0.98 # If magnitude shrinks, it is entangled/mixed!
            })

        return jsonify({
            "num_qubits": num_qubits,
            "gates_applied": circuit_steps,
            "statevector": statevector_results,
            "bloch_vectors": bloch_coordinates,
            "success": True
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/quantum/preset', methods=['GET'])
def get_presets():
    # Standard presets (Bell state, GHZ state, Quantum Fourier Transform, Swap, etc.)
    return jsonify({
        "presets": [
            {
                "id": "bell_state",
                "name": "Bell State (Entanglement)",
                "description": "Creates a maximally entangled Bell state |00> + |11>. Notice how both qubit Bloch vectors shrink to the center (0,0,0) because they enter a mixed state when traced individually!",
                "num_qubits": 2,
                "gates": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "targets": [0, 1]}
                ]
            },
            {
                "id": "superposition",
                "name": "Single Qubit Superposition",
                "description": "Applies a Hadamard gate to place Qubit 0 in an equal superposition of |0> and |1>. The Bloch vector points perfectly along the X-axis.",
                "num_qubits": 1,
                "gates": [
                    {"gate": "h", "targets": [0]}
                ]
            },
            {
                "id": "ghz_state",
                "name": "GHZ State (3-Qubit Entanglement)",
                "description": "Creates a Greenberger-Horne-Zeilinger state: (|000> + |111>) / sqrt(2). Represents multi-qubit entanglement.",
                "num_qubits": 3,
                "gates": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "targets": [0, 1]},
                    {"gate": "cx", "targets": [1, 2]}
                ]
            },
            {
                "id": "quantum_phase_kickback",
                "name": "Phase Kickback Effect",
                "description": "Demonstrates phase kickback. Placing qubit 0 in superposition, qubit 1 in |1> state, applying a H, then a CNOT. Qubit 0 gets phase-shifted due to the control-target interaction!",
                "num_qubits": 2,
                "gates": [
                    {"gate": "x", "targets": [1]},
                    {"gate": "h", "targets": [0]},
                    {"gate": "h", "targets": [1]},
                    {"gate": "cx", "targets": [0, 1]},
                    {"gate": "h", "targets": [0]}
                ]
            }
        ]
    })

if __name__ == '__main__':
    print("==========================================")
    print("   Antigravity Quantum Simulator Backend")
    print(f"   Running on http://localhost:{PORT}")
    print("==========================================")
    app.run(host='0.0.0.0', port=PORT, debug=True)
