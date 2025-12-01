# Dependency Sentry

### Steps:
1. Ensure you have tetragon & tetra cli installed.
2. Configure your bubblewrap command:
```
# Get the current directory path
PWD=$(pwd)

# Run the install inside the bubble
# We print the PID of bwrap so we know what to look for
echo "Starting Bubblewrap..."
bwrap \
  --ro-bind /usr /usr \
  --ro-bind /lib /lib \
  --ro-bind /lib64 /lib64 \
  --ro-bind /home/northway/.nvm/versions/node/v22.16.0/ /home/northway/.nvm/versions/node/v22.16.0/ \
  --ro-bind /etc/resolv.conf /etc/resolv.conf \
  --ro-bind /etc/ssl /etc/ssl \
  --proc /proc \
  --tmpfs /tmp \
  --dev /dev \
  --share-net \
  --bind $PWD /app \
  --chdir /app \
  --die-with-parent \
  npm install
```
3. Load the tracingpolicy
4. Run `tetra getevents -o json > ./tetra_log_v8.jsonl`
5. Use `node ./jsonl2json.js` to transform the logs
6. Use `node ./data-explorer.js` to generate the report

