# Session: [AUTO] UI balance cleanup

**Date:** 2026-08-06
**Mode:** dev
**Type:** bugfix
**Area:** tool UI
**Result:** pass
**Files changed:** `tool/src/app.css`, `tool/test/smoke-guard.js`, `tool/Phieu-Incentive.html`, `docs/REPO_SNAPSHOT.md`, `handoff/tasks/20260806_ui-balance-cleanup.md`, `log/sessions/20260806_dev_tool_ui-balance-cleanup.md`

## What happened

Dropzone và empty-state card ở tab Phiếu chạm nhau vì base `.drop` không có bottom margin; tab Dashboard dựa vào margin của `.file-list` rỗng nên spacing không có contract rõ ràng. Đã chuẩn hóa cả hai tab về 18px, khôi phục tỷ lệ heading từ bản thẩm mỹ gốc, build/test/browser-QA thành công và dọn artifact/cache tái tạo được.

## Decision

Giữ source/build/test/governance; chỉ xóa output QA, Playwright state và `node_modules`. HTML một-file cần `tool/src/` + `tool/build.py` để bảo trì đúng quy trình, còn test harness và audit trail là bằng chứng chống regression, không phải file rác.
