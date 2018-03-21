"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const process_1 = require("process");
const constants_1 = require("./constants");
/**
 * CPU metrics are unreliable inside a containerized environment (Docker)
 * Only things we should rely on are versions and now date
 */
function metric() {
    const freememBytes = os_1.freemem();
    const totalmemBytes = os_1.totalmem();
    const cpusSeconds = os_1.cpus().map((cpu) => {
        const { model, speed, times } = cpu;
        const { user, nice, sys, idle, irq } = times;
        return {
            model,
            speed,
            times: {
                user: Math.floor(user / 1000),
                nice: Math.floor(nice / 1000),
                sys: Math.floor(sys / 1000),
                idle: Math.floor(idle / 1000),
                irq: Math.floor(irq / 1000),
            },
        };
    });
    return {
        version: constants_1.APP_VERSION,
        node_version: // version of application defined in package.json
        process_1.version,
        arch: os_1.arch(),
        hostname: os_1.hostname(),
        platform: os_1.platform(),
        release: os_1.release(),
        freemem_GiB: freememBytes / 1024 / 1024 / 1024,
        totalmem_GiB: totalmemBytes / 1024 / 1024 / 1024,
        freemem_GB: freememBytes / 1000 / 1000 / 1000,
        totalmem_GB: totalmemBytes / 1000 / 1000 / 1000,
        os_uptime: Math.floor(os_1.uptime()),
        p_uptime: Math.floor(process_1.uptime()),
        now: new Date(),
        loadavg: os_1.loadavg(),
        cpus: cpusSeconds,
    };
}
exports.metric = metric;
exports.default = metric;
//# sourceMappingURL=metric.js.map