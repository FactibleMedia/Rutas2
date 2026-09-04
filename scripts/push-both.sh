#!/usr/bin/env bash
# Pushes the current branch to both remotes at once:
#   - origin (FactibleMedia/Rutas2, the fork)   -> same branch name
#   - upstream (jogutierrezc/Rutas2, original)  -> the `deploy` branch
#
# `upstream` here means "the original repo we now have write access to",
# not the traditional read-only sense -- see CLAUDE.md.
#
# Usage:
#   ./scripts/push-both.sh              # push HEAD to both
#   ./scripts/push-both.sh --force      # force-push both (asks first)
set -euo pipefail

UPSTREAM_DEPLOY_BRANCH="deploy"
FORCE=""

if [[ "${1:-}" == "--force" ]]; then
  read -p "Force-push will overwrite history on both remotes' branches. Continue? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
  FORCE="--force"
fi

branch=$(git branch --show-current)
if [[ -z "$branch" ]]; then
  echo "Not on a branch (detached HEAD?) -- aborting."
  exit 1
fi

echo "== pushing '$branch' to origin (fork) =="
git push $FORCE origin "$branch"

echo
echo "== pushing '$branch' to upstream:$UPSTREAM_DEPLOY_BRANCH (original repo) =="
git push $FORCE upstream "$branch:$UPSTREAM_DEPLOY_BRANCH"

echo
echo "Done. origin/$branch and upstream/$UPSTREAM_DEPLOY_BRANCH both updated."
