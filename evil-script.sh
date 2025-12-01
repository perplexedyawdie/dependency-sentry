    
#!/bin/sh

echo "--- [TEST] Starting Malicious Postinstall Script ---"

# Action 1 & 2: Trigger COMMAND (sys_execve) and NETWORK (tcp_connect) alerts.
# This executes 'curl' and connects to a non-registry IP address.
echo "ACTION 1 & 2: Triggering COMMAND and NETWORK alerts..."
curl -I https://google.com || echo " -> Curl failed, but the execve event was still logged."

# Action 3: Trigger SENSITIVE FILE READ (security_file_permission) alert.
# This attempts to read /etc/shadow. The kernel hook logs the *attempt*, even if it fails.
echo "ACTION 3: Triggering SENSITIVE FILE READ alert..."
cat /etc/shadow 2>/dev/null || echo " -> Read attempt on /etc/shadow was logged."

# Action 4: Trigger SENSITIVE FILE WRITE (security_file_permission) alert.
# This creates a new file inside the /app directory.
echo "ACTION 4: Triggering SENSITIVE FILE WRITE alert..."
echo "console.log('malicious code');" > ./backdoor.js
echo " -> Wrote a file to the project directory."

echo "--- [TEST] Postinstall Script Finished ---"

  