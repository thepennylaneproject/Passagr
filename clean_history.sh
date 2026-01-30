#!/bin/bash
set -e

# 1. Create a new orphan branch (empty history)
git checkout --orphan temp_clean_branch

# 2. Stage all files (respecting current .gitignore which ignores .env.local)
git add -A

# 3. Commit the clean state
git commit -m "feat: initial clean commit for passagr"

# 4. Delete the old main branch
git branch -D main

# 5. Rename current branch to main
git branch -m main

# 6. Force push to overwrite remote history
# Note: This requires the user to approve the destructive action
echo "Ready to force push. Run: git push -f origin main"
