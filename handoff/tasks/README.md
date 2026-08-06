# handoff/tasks

Một việc là một file: `{YYYYMMDD}_{slug}.md`. Mỗi file chứa trọn vòng đời của việc đó.

```markdown
# <Tên việc>

> **Bản đồ repo:** đọc `docs/REPO_SNAPSHOT.md` trước khi bắt đầu.
> **Luật đã chốt:** đọc `log/rules.md`.

**Status:** open | done
**Giao ngày:** YYYY-MM-DD

## 1. DIRECTIVE      <- Claude (CEO) viết: 4 trường
## 2. TODO           <- Codex (CTO) viết: technical plan + checklist + Test Plan
## 3. AUDIT          <- Codex viết REPORT; Claude viết REVIEW
```

Không chép nội dung `REPO_SNAPSHOT.md` hay `rules.md` vào đây — chỉ trỏ.
