import {
  arch,
  cpus,
  freemem,
  hostname,
  loadavg,
  platform,
  release,
  totalmem,
  uptime as osUptime
} from "os";
import { uptime as pUptime, version as nodeVersion } from "process";
import { APP_NAME, APP_VERSION } from "../constants";

/**
 * CPU metrics are unreliable inside a containerized environment (Docker)
 * Only things we should rely on are versions and now date
 */
function metric() {
  const freememBytes = freemem();
  const totalmemBytes = totalmem();
  const cpusSeconds = cpus().map(cpu => {
    const { model, speed, times } = cpu;
    const { user, nice, sys, idle, irq } = times;
    return {
      model, // CPU model
      speed, // CPU speed (MHz)
      times: {
        user: Math.floor(user / 1000), // Time CPU spent in user mode (seconds)
        nice: Math.floor(nice / 1000), // Time CPU spent in nice mode (seconds)
        sys: Math.floor(sys / 1000), // Time CPU spent in sys mode (seconds)
        idle: Math.floor(idle / 1000), // Time CPU spent in idle mode (seconds)
        irq: Math.floor(irq / 1000) // Time CPU spent in irq mode (seconds)
      }
    };
  });

  return {
    name: APP_NAME, 
    version: APP_VERSION, // version of application defined in package.json
    nodeVersion, // version of Node.js running the web application
    arch: arch(), // CPU architecture that compiled Node.js binary
    hostname: hostname(), // operating system hostname
    platform: platform(), // 'linux', 'darwin' supported
    release: release(),
    freememGiB: freememBytes / 1024 / 1024 / 1024, // 1 GiB = 1024^3 bytes
    totalmemGiB: totalmemBytes / 1024 / 1024 / 1024, // 1 GiB = 2^30 bytes
    freememGB: freememBytes / 1000 / 1000 / 1000, // 1 GB = 1000^3 bytes
    totalmemGB: totalmemBytes / 1000 / 1000 / 1000, // 1 GB = 10^9 bytes
    osUptime: Math.floor(osUptime()), // operating system uptime (seconds)
    pUptime: Math.floor(pUptime()), // app process uptime (seconds)
    now: new Date(), // system reported current time
    loadavg: loadavg(), // 1, 5, 15 min CPU load averages
    cpus: cpusSeconds
  };
}

export default metric;
