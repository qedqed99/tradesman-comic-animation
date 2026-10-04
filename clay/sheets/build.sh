#!/bin/sh
# Build the self-contained sheets page: inline comic crops ({{name}}) and clay renders ({{turn:name}}).
# usage: sh clay/sheets/build.sh <out.html>
set -e
D=$(cd "$(dirname "$0")" && pwd); T=$(mktemp -d)
for f in "$D"/ref/*.jpg; do ffmpeg -v error -y -i "$f" -vf "scale='min(720,iw)':-1" -q:v 5 "$T/$(basename "$f")"; done
mkdir -p "$T/turn"; for f in "$D"/turn/*.jpg; do ffmpeg -v error -y -i "$f" -vf "scale='min(480,iw)':-1" -q:v 5 "$T/turn/$(basename "$f")"; done
python3 - "$D/sheets.src.html" "$T" "$1" <<'PY'
import base64, re, sys
src, tmp, out = sys.argv[1:]
s = open(src).read()
def emb(m):
    name = m.group(1)
    path = f"{tmp}/turn/{name[5:]}.jpg" if name.startswith('turn:') else f"{tmp}/{name}.jpg"
    return 'data:image/jpeg;base64,' + base64.b64encode(open(path, 'rb').read()).decode()
open(out, 'w').write(re.sub(r'\{\{([\w:.-]+)\}\}', emb, s))
PY
rm -rf "$T"
