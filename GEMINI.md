# GLOBAL PROJECT RULE: ONE FILE – ONE COMMIT – ONE PUSH

This is a mandatory workflow rule for the entire Web Generator project.
Whenever ANY modification is made to the project, immediately commit and push that change to the connected GitHub repository.

## 1. STRICT RULE

ONE FILE = ONE COMMIT = ONE PUSH

For every modified file:
1. Modify exactly one file.
2. Review the changes in that file.
3. Run the relevant checks wherever applicable.
4. Stage ONLY that specific file.
5. Create a separate Git commit for that file.
6. Immediately push that commit to the existing GitHub branch.
7. Verify that the push was successful.
8. Only then move to the next file.

Example:
- File 1 modified → Commit 1 → Push 1
- File 2 modified → Commit 2 → Push 2
- File 3 modified → Commit 3 → Push 3

Never combine multiple modified files into a single commit.

## 2. COMMIT MESSAGE FORMAT

Use meaningful commit messages following this format:
- `fix(api): secure frame ownership validation`
- `fix(auth): enforce authentication on testing routes`
- `fix(database): correct schema migration`
- `feat(ai): improve generation error handling`
- `refactor(api): centralize request validation`
- `test(security): add ownership verification tests`
- `docs(workflow): persist mandatory ONE FILE - ONE COMMIT - ONE PUSH project rule`

Use appropriate conventional commit prefixes:
- `feat`
- `fix`
- `refactor`
- `test`
- `docs`
- `chore`
- `style`

## 3. GIT WORKFLOW

Before starting:
- Check the current Git branch.
- Check `git status`.
- Verify the connected remote repository.
- Confirm the current working tree state.

For every individual file:
- Stage only the file you modified (`git add <file>`).
- Never use `git add .` or `git add -A`.
- Never include unrelated user changes.
- Commit the individual file.
- Push immediately to the existing branch (`git push origin <branch>`).
- Verify the commit exists on the remote.

## 4. IMPORTANT SAFETY RULES

- Never overwrite existing Git history.
- Never use `git push --force`.
- Never amend an existing commit.
- Never reset or discard unrelated changes.
- Never commit `.env` files, API keys, credentials, tokens, secrets or sensitive data.
- Respect `.gitignore`.
- Do not push if secrets or sensitive information are detected.
- If a push fails, diagnose and resolve the issue safely before continuing.
- If merge conflicts occur, stop and report them rather than destroying existing work.
- If a file is modified by another process or by the user, do not overwrite their changes.

## 5. MULTI-FILE OPERATIONS

Even when one task requires modifying multiple files:
- Modify and commit one file at a time.
- Push each file's commit immediately.
- Do not wait until all files are modified.
- Do not create a single combined commit at the end.

## 6. FINAL REPORT REQUIREMENTS

After every task, provide:
- Files modified.
- Individual commit messages.
- Commit hashes.
- Push confirmation for each file.
- Current branch name.
- Final git status.
- Any files intentionally left uncommitted and the reason.
