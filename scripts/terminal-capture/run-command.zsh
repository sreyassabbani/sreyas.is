#!/bin/zsh

# Codex deliberately sets this for readable automation logs. A real interactive
# terminal does not, and leaving it set disables Yazi's file-type palette.
unset NO_COLOR

status_file="$1"
shift
status_tmp="${status_file}.tmp.$$"

printf 'running\n' > "$status_tmp"
mv -f "$status_tmp" "$status_file"

# Remove login-shell residue before the capture command paints its UI.
printf '\033[2J\033[H'
# Let Ghostty finish applying its initial cell geometry before short-lived
# commands paint the first row.
sleep 0.2

"$@"
command_status=$?
printf 'exit:%s\n' "$command_status" > "$status_tmp"
mv -f "$status_tmp" "$status_file"

# Keep the surface alive without Ghostty's "process exited" overlay. The
# capture controller terminates this dedicated app instance after the shot.
while true; do
    sleep 3600
done
