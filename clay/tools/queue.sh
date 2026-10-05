#!/bin/bash
# Overnight render queue: renders each scene named in clay/queue.txt (one per line, in order),
# then re-composites the whole cut so renders/clay-review.mp4 always holds every finished scene.
# Stops when it reaches a line "END". Log: /tmp/queue.log
cd /tmp
Q=/mnt/project-files/tradesman-animation/clay/queue.txt
T=/mnt/project-files/tradesman-animation
RES=${RES:-960x540}; SAMPLES=${SAMPLES:-16}
done_list=""
while true; do
  next=""
  while read -r s; do
    [ -z "$s" ] && continue
    [ "$s" = "END" ] && { [ -z "$next" ] && { echo "queue finished $(date -u +%H:%M)"; exit 0; }; break; }
    case " $done_list " in *" $s "*) continue;; esac
    next=$s; break
  done < "$Q"
  if [ -z "$next" ]; then sleep 20; continue; fi
  echo "start $next $(date -u +%H:%M)"
  rm -rf "$T/clay/frames/$next.new"
  /opt/clay/bin/python "$T/clay/blender/render.py" --scene "$next" --res "$RES" --samples "$SAMPLES" > "/tmp/render-$next.log" 2>&1
  if [ $? -eq 0 ] && [ -f "$T/clay/frames/$next/anchors.json" ]; then
    echo "rendered $next $(date -u +%H:%M)"
    node "$T/clay/tools/render.mjs" "$T/renders/clay-review.mp4" > "/tmp/composite.log" 2>&1 && echo "composited after $next" || echo "COMPOSITE FAILED after $next"
  else
    echo "RENDER FAILED $next (see /tmp/render-$next.log)"
  fi
  done_list="$done_list $next"
done
