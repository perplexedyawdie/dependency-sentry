const fs = require('fs');

/**
 * Analyzes a file path to determine the package attribution from a node_modules directory.
 * @param {string} cwdPath The current working directory path from the Tetragon event.
 * @returns {[string, string]} A tuple-like array containing the [packageName, fullPath].
 */
function getAttribution(cwdPath) {
    // Regex to capture the package segment inside node_modules.
    const pattern = /.*\/node_modules\/((?:@[^/]+\/)?[^/]+)/;
    const match = cwdPath.match(pattern);

    if (match && match[1]) {
        const packageName = match[1];
        return [packageName, cwdPath];
    }

    if (cwdPath.startsWith("/app")) {
        return ["Root Project (postinstall)", cwdPath];
    }

    return ["Unknown/System", cwdPath];
}


try {
    // obtained using `dig registry.npmjs.org  +short`
    const KNOWN_REGISTRY_IPS = new Set([
        "104.16.25.34",
        "104.16.1.35",
        "104.16.24.34",
        "104.16.31.34",
        "104.16.3.35",
        "104.16.0.35",
        "104.16.28.34",
        "104.16.30.34",
        "104.16.29.34",
        "104.16.26.34",
        "104.16.27.34",
        "104.16.2.35",
    ]);


    const report = {
        "COMMAND": [],
        "FILE_SENSITIVE": [],
        "NETWORK": []
    };
    const data = fs.readFileSync('/home/northway/Documents/hackathons/ebpf-hackathon/tetra_log_v8.json', 'utf8');
    const tetragonJsonLogs = JSON.parse(data);
    for (const event of tetragonJsonLogs) {
        if (event.process_exec) {
            const process = event.process_exec.process;
            const cwd = process?.cwd || "";
            const [pkgName, pkgPath] = getAttribution(cwd);
            const binary = process?.binary;
            const args = process?.arguments;

            const suspiciousBinaries = ["/bin/sh", "/bin/bash", "/usr/bin/curl", "/usr/bin/wget"];
            if (binary && suspiciousBinaries.includes(binary)) {
                report["COMMAND"].push({
                    package: pkgName,
                    path: pkgPath,
                    detail: `Executed: ${binary} ${args}`
                });
            }
            const sensitiveReadPaths = [
                "/boot",
                "/root/.ssh",
                "/etc/shadow",
                "/etc/profile",
                "/etc/sudoers",
                "/etc/pam.conf",
                "/etc/bashrc",
                "/etc/csh.cshrc",
                "/etc/csh.login",
                ".bashrc",
                ".bash_profile",
                ".bash_login",
                ".bash_logout",
                ".cshrc",
                ".cshdirs",
                ".profile",
                ".login",
                ".logout",
                ".history"
            ];
            if (sensitiveReadPaths.some(p => args.startsWith(p))) {
                report["FILE_SENSITIVE"].push({
                    package: pkgName,
                    path: pkgPath,
                    detail: `SENSITIVE READ: ${args}`
                });
            }

        }
        else if (event.process_kprobe) {
            const process = event.process_kprobe.process;
            const functionName = event.process_kprobe.function_name;
            const kprobeArgs = event.process_kprobe.args;
            const cwd = process?.cwd || "";
            const [pkgName, pkgPath] = getAttribution(cwd);
            
            if (functionName === "tcp_connect") {
                // For 'sock' types, the destination address is in 'sock_arg.daddr'.
                const ip = kprobeArgs?.[0]?.sock_arg?.daddr;

                if (!ip) continue;

                if (!KNOWN_REGISTRY_IPS.has(ip)) {
                    report["NETWORK"].push({
                        package: pkgName,
                        path: pkgPath,
                        detail: `Outbound connection to: ${ip}`
                    });
                }
            }
        }
    }
    const filePath = "report.json"
    const reportString = JSON.stringify(report, null, 4);
    fs.writeFile(filePath, reportString, (err) => {
        if (err) {
            console.error("Error writing file:", err);
            return;
        }
        console.log("JSON data written to", filePath);
    });

} catch (err) {
    console.error('Error reading or parsing JSON file:', err);
}