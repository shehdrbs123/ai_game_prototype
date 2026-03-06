# Commit Helper Skill

## Purpose
Use this skill when the user asks to:
- split current changes into logical commits (feature/docs/chore/refactor boundaries),
- write commit messages in a strict template,
- execute commits using the local commit formatter command.

## Inputs
- Current git working tree status (`git status --short`)
- File-level diffs (`git diff -- <path>`)
- User-required commit message format

## Workflow
1. Inspect uncommitted changes and cluster by responsibility.
2. Propose or apply minimal commit groups without mixing unrelated files.
3. Commit each group with this template:
   - `[커밋 항목] 내용 요약`
   - `- 변경 사유 : ~~`
   - `- 변경 내용 : ~~`
   - `- 영향성 : ~~`
4. Prefer the local formatter command:
   - `npm run commit:fmt -- -CommitItem "<item>" -Summary "<summary>" -Reason "<reason>" -Changes "<changes>" -Impact "<impact>"`
5. Verify result:
   - `git log --oneline -n <count>`
   - `git status --short`

## Constraints
- Do not rewrite or squash existing commits unless explicitly requested.
- Do not include unrelated files in the same commit.
- Keep commit text concrete and auditable.
