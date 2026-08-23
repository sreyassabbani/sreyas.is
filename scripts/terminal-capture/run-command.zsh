#!/bin/zsh

# Codex deliberately sets this for readable automation logs. A real interactive
# terminal does not, and leaving it set disables Yazi's file-type palette.
unset NO_COLOR

status_file="$1"
shift

# Remove login-shell residue before the capture command paints its UI.
printf '\033[2J\033[H'

"$@"
command_status=$?
printf '%s\n' "$command_status" > "$status_file"

# Keep the surface alive without Ghostty's "process exited" overlay. The
# capture controller terminates this dedicated app instance after the shot.
while true; do
    sleep 3600
done
