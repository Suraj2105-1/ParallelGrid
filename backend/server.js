import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, 'history.json');

// Helper to read history
async function readHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write history
async function writeHistory(history) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

// GET: System hardware mock stats
app.get('/api/system-stats', (req, res) => {
  const cores = 8;
  const cpuLoad = Math.floor(20 + Math.random() * 40); // 20% to 60%
  const ramUsage = Math.floor(40 + Math.random() * 20); // 40% to 60%
  const temp = Math.floor(45 + Math.random() * 15); // 45C to 60C
  
  // Simulated thread activity
  const threads = Array.from({ length: cores }, (_, i) => ({
    id: i,
    load: Math.floor(10 + Math.random() * 80),
    activeTask: i % 2 === 0 ? 'Parallel Reduction' : 'Matrix Multiply',
    temperature: temp + Math.floor((Math.random() - 0.5) * 6)
  }));

  res.json({
    timestamp: new Date().toISOString(),
    cpu: {
      load: cpuLoad,
      cores: cores,
      threads: threads,
      temperature: temp,
    },
    memory: {
      totalGB: 16,
      usedPercent: ramUsage,
      usedGB: parseFloat(((16 * ramUsage) / 100).toFixed(2))
    },
    gpu: {
      name: "NVIDIA GeForce RTX 4070 (Simulated)",
      load: Math.floor(5 + Math.random() * 30),
      memoryUsedPercent: Math.floor(25 + Math.random() * 10),
      memoryTotalGB: 12
    }
  });
});

// GET: CRUD - List all benchmark runs
app.get('/api/history', async (req, res) => {
  const history = await readHistory();
  // Sort by date descending
  res.json(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// POST: CRUD - Save a new benchmark run
app.post('/api/history', async (req, res) => {
  const { title, type, params, results, notes } = req.body;
  
  if (!title || !type || !params || !results) {
    return res.status(400).json({ error: 'Missing required benchmark data fields' });
  }

  const history = await readHistory();
  const newRun = {
    id: 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    title,
    type,
    params,
    results,
    notes: notes || ''
  };

  history.push(newRun);
  await writeHistory(history);
  res.status(201).json(newRun);
});

// PUT: CRUD - Update a benchmark notes or title
app.put('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  const { title, notes } = req.body;

  const history = await readHistory();
  const runIndex = history.findIndex(item => item.id === id);

  if (runIndex === -1) {
    return res.status(404).json({ error: 'Benchmark run not found' });
  }

  if (title !== undefined) history[runIndex].title = title;
  if (notes !== undefined) history[runIndex].notes = notes;

  await writeHistory(history);
  res.json(history[runIndex]);
});

// DELETE: CRUD - Delete a benchmark run
app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;

  let history = await readHistory();
  const runExists = history.some(item => item.id === id);

  if (!runExists) {
    return res.status(404).json({ error: 'Benchmark run not found' });
  }

  history = history.filter(item => item.id !== id);
  await writeHistory(history);
  res.json({ message: 'Benchmark run deleted successfully', id });
});

// POST: Run a Parallel Benchmark Simulation
app.post('/api/benchmark/run', (req, res) => {
  const { type, params } = req.body;

  if (!type || !params) {
    return res.status(400).json({ error: 'Type and params are required' });
  }

  let results = {};

  switch (type) {
    case 'amdahls_law': {
      // Params: parallelFraction (0 to 1), maxCores (e.g. 64)
      const p = parseFloat(params.parallelFraction) || 0.85;
      const maxCores = parseInt(params.maxCores) || 64;
      const baseTime = parseFloat(params.baseTime) || 100.0; // seconds on 1 core

      const coreValues = [1, 2, 4, 8, 16, 32, 64, 128, 256].filter(c => c <= maxCores);
      if (!coreValues.includes(maxCores)) {
        coreValues.push(maxCores);
      }
      coreValues.sort((a, b) => a - b);

      const amdahlPoints = [];
      const gustafsonPoints = [];
      const efficiencyPoints = [];

      coreValues.forEach(c => {
        // Amdahl's Law Speedup: S(N) = 1 / ((1 - P) + (P / N))
        const amdahlSpeedup = 1 / ((1 - p) + (p / c));
        const amdahlTime = baseTime / amdahlSpeedup;

        // Gustafson's Law Speedup (Scaled Speedup): S(N) = N - (N - 1) * (1 - P)
        const gustafsonSpeedup = c - (c - 1) * (1 - p);

        // Efficiency = Speedup / N
        const efficiency = (amdahlSpeedup / c) * 100;

        amdahlPoints.push({ cores: c, speedup: parseFloat(amdahlSpeedup.toFixed(2)), timeSec: parseFloat(amdahlTime.toFixed(2)) });
        gustafsonPoints.push({ cores: c, speedup: parseFloat(gustafsonSpeedup.toFixed(2)) });
        efficiencyPoints.push({ cores: c, efficiencyPercent: parseFloat(efficiency.toFixed(2)) });
      });

      results = {
        summary: `Simulated parallel speedup with parallel fraction P = ${(p * 100).toFixed(1)}%.`,
        idealSpeedup: maxCores,
        amdahlSpeedup: amdahlPoints[amdahlPoints.length - 1].speedup,
        gustafsonSpeedup: gustafsonPoints[gustafsonPoints.length - 1].speedup,
        efficiencyPercent: efficiencyPoints[efficiencyPoints.length - 1].efficiencyPercent,
        charts: {
          amdahlPoints,
          gustafsonPoints,
          efficiencyPoints
        }
      };
      break;
    }

    case 'load_balancing': {
      // Params: taskCount (e.g. 20), coreCount (e.g. 4), strategy ('static' or 'dynamic'), variance ('low' | 'high')
      const taskCount = parseInt(params.taskCount) || 20;
      const coreCount = parseInt(params.coreCount) || 4;
      const strategy = params.strategy || 'static'; // 'static' or 'dynamic'
      const variance = params.variance || 'high'; // 'low' or 'high'

      // Generate simulated tasks with varying load sizes
      const tasks = Array.from({ length: taskCount }, (_, i) => {
        const baseSize = variance === 'low' ? 10 : 5;
        const multiplier = variance === 'low' ? 5 : 25;
        const size = Math.floor(baseSize + Math.random() * multiplier); // units of work / ms
        return { id: `task_${i + 1}`, size };
      });

      // Core simulation state
      const cores = Array.from({ length: coreCount }, (v, i) => ({
        id: i + 1,
        timeline: [],
        totalWork: 0,
        idleTime: 0
      }));

      if (strategy === 'static') {
        // Static Scheduling: assign tasks in a round-robin order
        tasks.forEach((task, index) => {
          const coreIndex = index % coreCount;
          const core = cores[coreIndex];
          const startTime = core.totalWork;
          const endTime = startTime + task.size;
          core.timeline.push({
            taskId: task.id,
            startTime,
            endTime,
            duration: task.size
          });
          core.totalWork = endTime;
        });
      } else {
        // Dynamic Scheduling: assign task to the core with the current least workload
        // (Simulates a dynamic shared work-queue pool)
        tasks.forEach((task) => {
          // Find the core that becomes idle first
          const core = cores.reduce((minCore, currentCore) => 
            currentCore.totalWork < minCore.totalWork ? currentCore : minCore
          , cores[0]);

          const startTime = core.totalWork;
          const endTime = startTime + task.size;
          core.timeline.push({
            taskId: task.id,
            startTime,
            endTime,
            duration: task.size
          });
          core.totalWork = endTime;
        });
      }

      // Calculate execution timeline
      const makeSpan = Math.max(...cores.map(c => c.totalWork)); // Total execution time

      // Fill in idle times for cores
      cores.forEach(c => {
        c.idleTime = makeSpan - c.totalWork;
        c.utilizationPercent = parseFloat(((c.totalWork / makeSpan) * 100).toFixed(1));
      });

      // Compute statistics (Standard Deviation of core workload shows balance)
      const workTimes = cores.map(c => c.totalWork);
      const avgWork = workTimes.reduce((a, b) => a + b, 0) / coreCount;
      const varianceVal = workTimes.reduce((sum, time) => sum + Math.pow(time - avgWork, 2), 0) / coreCount;
      const stdDev = Math.sqrt(varianceVal);

      results = {
        strategy,
        makeSpan,
        avgCoreWorkload: parseFloat(avgWork.toFixed(1)),
        workloadStdDev: parseFloat(stdDev.toFixed(2)),
        cores: cores.map(c => ({
          id: c.id,
          totalWork: c.totalWork,
          idleTime: c.idleTime,
          utilizationPercent: c.utilizationPercent,
          timeline: c.timeline
        })),
        summary: `Simulated ${strategy} scheduling of ${taskCount} tasks on ${coreCount} cores. Make span: ${makeSpan} ms. Workload imbalance standard deviation: ${stdDev.toFixed(1)}.`
      };
      break;
    }

    case 'matrix_vector': {
      // Params: matrixSize (N x N, e.g. 1024), threadCount (e.g. 8)
      const n = parseInt(params.matrixSize) || 1024;
      const threads = parseInt(params.threadCount) || 8;

      // 1D row decomposition (simple OpenMP loop) vs 2D block decomposition (cache optimized)
      // Computation: N^2 multiply-adds. Memory transfer: N^2 + 2N elements
      const operations = 2 * n * n; // 2 * N^2 floating point ops
      
      // Simulate performance on CPU
      // Base calculation times with architectural overhead
      const baseTimeMs = (operations / 5000000); // 5 GFLOPS base single core
      
      // 1D Decomposition: simple row allocation. High cache line bouncing, simple sync.
      const speedup1D = threads * 0.78; // 78% efficiency
      const time1D = (baseTimeMs / speedup1D) + (threads * 0.05); // thread spawn overhead
      
      // 2D Decomposition: block matrix distribution. Excellent cache locality, slightly complex reduction.
      const speedup2D = threads * 0.88; // 88% efficiency
      const time2D = (baseTimeMs / speedup2D) + (Math.log2(threads) * 0.08); // logarithmic sync overhead

      results = {
        matrixSize: n,
        operations,
        singleCoreTimeMs: parseFloat(baseTimeMs.toFixed(2)),
        decomp1D: {
          executionTimeMs: parseFloat(time1D.toFixed(3)),
          speedup: parseFloat(speedup1D.toFixed(2)),
          efficiencyPercent: parseFloat(((speedup1D / threads) * 100).toFixed(1)),
          gflops: parseFloat(((operations / (time1D / 1000)) / 1e9).toFixed(2))
        },
        decomp2D: {
          executionTimeMs: parseFloat(time2D.toFixed(3)),
          speedup: parseFloat(speedup2D.toFixed(2)),
          efficiencyPercent: parseFloat(((speedup2D / threads) * 100).toFixed(1)),
          gflops: parseFloat(((operations / (time2D / 1000)) / 1e9).toFixed(2))
        },
        comparison: `2D decomposition achieves a ${(time1D / time2D).toFixed(2)}x speedup over 1D due to improved L3 cache locality.`
      };
      break;
    }

    case 'concurrency_locks': {
      // Params: threadCount (e.g. 4), useMutex (boolean), incrementsPerThread (e.g. 1000)
      const threadCount = parseInt(params.threadCount) || 4;
      const useMutex = params.useMutex === 'true' || params.useMutex === true;
      const incrementsPerThread = parseInt(params.incrementsPerThread) || 1000;
      
      const targetSum = threadCount * incrementsPerThread;
      let actualSum = 0;
      let timeElapsed = 0;
      let collisions = 0;

      if (useMutex) {
        actualSum = targetSum;
        // Mutex causes serialization and locking overhead
        timeElapsed = threadCount * (incrementsPerThread * 0.05); // Simulated ms
      } else {
        // Race condition math: likelihood of collision increases with thread count
        const collisionRate = 1 - Math.exp(-(threadCount - 1) * 0.1);
        collisions = Math.floor(targetSum * collisionRate);
        actualSum = targetSum - collisions;
        // Faster but wrong
        timeElapsed = (incrementsPerThread * 0.01) + (threadCount * 2); 
      }

      results = {
        summary: useMutex 
          ? `Mutex locked enabled. Threads safely synchronized.` 
          : `Race condition occurred! Multiple threads overwrote memory simultaneously.`,
        targetSum,
        actualSum,
        dataLoss: targetSum - actualSum,
        timeElapsed: parseFloat(timeElapsed.toFixed(2)),
        useMutex
      };
      break;
    }

    case 'opencl_vecadd': {
      // Params: vectorSize (elements, e.g., 1,000,000)
      const size = parseInt(params.vectorSize) || 1000000;
      
      // CPU speed (parallel loop, multi-threaded)
      // O(N) operations. Simple CPU vector adds are memory bandwidth limited (RAM bandwidth ~40 GB/s)
      const cpuBandwidthGBs = 35; // 35 GB/s
      const dataSizeGb = (size * 3 * 4) / 1e9; // 3 vectors (A, B, C) of 4-byte floats
      const cpuTimeMs = (dataSizeGb / cpuBandwidthGBs) * 1000 + 0.05; // ~ms + minor overhead

      // GPU speed (OpenCL Kernel execution)
      // PCIe Host-to-Device transfer: A and B vectors. (PCIe Gen4 x16 ~25 GB/s safe practical limit)
      const pcieBandwidthGBs = 18; 
      const inputTransferGb = (size * 2 * 4) / 1e9;
      const transferInTimeMs = (inputTransferGb / pcieBandwidthGBs) * 1000;

      // GPU Compute: Kernel Execution. (GPU memory bandwidth ~500 GB/s for RTX 4070)
      const gpuBandwidthGBs = 504;
      const gpuComputeTimeMs = (dataSizeGb / gpuBandwidthGBs) * 1000 + 0.02; // very fast memory access + minor thread latency

      // PCIe Device-to-Host transfer: C vector
      const outputTransferGb = (size * 1 * 4) / 1e9;
      const transferOutTimeMs = (outputTransferGb / pcieBandwidthGBs) * 1000;

      // Compile overhead (only happens first run, but simulated here as static driver overhead)
      const openCLCompilationMs = 1.8; // JIT compiler lag

      const totalGPUTimeMs = transferInTimeMs + gpuComputeTimeMs + transferOutTimeMs;
      const totalGPUWithJitMs = totalGPUTimeMs + openCLCompilationMs;

      results = {
        vectorSize: size,
        dataSizeBytes: size * 3 * 4,
        cpuTimeMs: parseFloat(cpuTimeMs.toFixed(3)),
        gpu: {
          hostToDeviceMs: parseFloat(transferInTimeMs.toFixed(3)),
          kernelComputeMs: parseFloat(gpuComputeTimeMs.toFixed(3)),
          deviceToHostMs: parseFloat(transferOutTimeMs.toFixed(3)),
          jitCompileMs: openCLCompilationMs,
          totalTimeMs: parseFloat(totalGPUTimeMs.toFixed(3)),
          totalWithJitMs: parseFloat(totalGPUWithJitMs.toFixed(3))
        },
        crossoverPointPassed: size > 150000, // Typically GPU is faster for size > 150,000 elements due to PCIe overhead bottlenecking small tasks
        comparison: size > 150000 
          ? `GPU execution is ${(cpuTimeMs / totalGPUTimeMs).toFixed(1)}x faster than CPU. PCIe transfer overhead occupies ${(transferInTimeMs / totalGPUTimeMs * 100 + transferOutTimeMs / totalGPUTimeMs * 100).toFixed(0)}% of total GPU time.`
          : `CPU is ${(totalGPUTimeMs / cpuTimeMs).toFixed(1)}x faster because data transfer over PCIe (${(transferInTimeMs + transferOutTimeMs).toFixed(2)}ms) outweighs the GPU compute speedup (${gpuComputeTimeMs.toFixed(3)}ms).`
      };
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown benchmark type: ${type}` });
  }

  res.json({
    type,
    params,
    timestamp: new Date().toISOString(),
    results
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Antigravity Parallel Computing Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`========================================`);
});
