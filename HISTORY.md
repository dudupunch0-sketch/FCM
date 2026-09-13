# FCM 개발 기록 색인

> 날짜별 작업 기록은 [`dev/history/`](dev/history)에 있다.
> 이 파일은 색인이며, 상세 내용은 각 날짜 파일에 있다.
>
> **이 파일은 "무엇을 했나"를 기록한다. "무엇이 규칙인가"는 [SSOT](docs/spec/current_decisions.md)가 기록한다.**
> 둘이 어긋나면 SSOT가 맞다.

---

# 타임라인

| 날짜 | 커밋 | 한 줄 |
|---|---|---|
| [2026-08-30](dev/history/2026-08-30.md) | 35 | 벤치마크 → 인터뷰 → 명세. 코드 없이 무엇을 만들지 확정 |
| [2026-09-08](dev/history/2026-09-08.md) | 6 | 콤보형 턴제 전투 확정, 플레이 가능한 시제품 |
| [2026-09-09](dev/history/2026-09-09.md) | 5 | 캐릭터 표현. 3D에서 모바일 픽셀로 수렴 |
| [2026-09-10](dev/history/2026-09-10.md) | 3 | 브랜치 병합만 |
| [2026-09-12](dev/history/2026-09-12.md) | 33 | 설계 22~37번 신설 후 전부 구현. 자가 대전 밸런스 측정 시작 |
| [2026-09-13](dev/history/2026-09-13.md) | 진행 중 | 이동·각·스탠스. 반응형 정책 균형. 스태미너 소모 |

---

# 문서 지도

| 무엇을 알고 싶은가 | 어디 |
|---|---|
| **지금 무엇이 규칙인가** | [`docs/spec/current_decisions.md`](docs/spec/current_decisions.md) — 단일 출처 |
| 개별 시스템의 상세 설계 | [`docs/design/`](docs/design) — 18번부터 38번 |
| 무엇을 언제 만드는가 | [`docs/spec/implementation_roadmap_part1_part2.md`](docs/spec/implementation_roadmap_part1_part2.md) |
| **검증·보정 도구를 어떻게 쓰는가** | [`docs/guide/testing_and_calibration.md`](docs/guide/testing_and_calibration.md) |
| 밸런스 수치 | `config/` — 코드에 수치가 없다 |
| 초기 인터뷰와 벤치마크 | [`docs/interviews/`](docs/interviews), [`docs/benchmark/`](docs/benchmark) |

## 설계 문서 빠른 색인

| | |
|---|---|
| 18 | 콤보형 턴제 전투와 정보 카드 |
| 19 | 전투 시제품 구현 |
| 21a·21b | 캐릭터 기반, 모바일 픽셀 전투 |
| **22** | **전투 거리 모델** — 이동 카드, 사이드 스텝, 스탠스와 오픈 가드 |
| 23 | 라운드 구조와 채점 |
| 24·25·26 | Base→Derived, Effective Performance, Action Result 판정 |
| 27 | 포지션과 그래플링 |
| 28·29 | 선수 계획 생성, Evidence→Knowledge |
| 30·31·32 | 콤보 경계와 서브비트, 정보 경제, 세이브와 결정론 |
| 33 | 난이도 |
| **34** | **AI 균형** — 자가 대전, 고정 계획과 반응형 정책 |
| 35·36·37 | 콘텐츠 물량, 화면 정보구조, 접근성·현지화·성능 |
| **38** | **스태미너 소모와 회복 상한** |

---

# 명령어

```bash
npm test                              # 규칙이 깨졌는가
npm run balance                       # 전략 다양성과 세계가 건강한가
npm run calibrate                     # 최적 플레이는 무엇인가 (고정 계획)
npm run calibrate:policies            # 조건부 카드가 실제로 쓰이는가 (반응형 정책)
node tools/calibrate.mjs grammar      # 정책 문법이 실제로 일하는가
npm run calibrate:check               # 저장된 AI가 현재 규칙과 맞는가
```

`calibrate:check`가 회귀 방지 장치다. 전투 규칙이 바뀌면 저장된 AI 혼합전략이
낡았다고 실패한다. **낡은 AI가 조용히 남아 있는 상황을 막는다.**

---

# 작성 규칙

- 날짜 파일 이름은 `YYYY-MM-DD.md`
- **측정한 숫자만 적는다.** 추정치는 추정이라고 적는다
- 잘못된 길로 갔던 것도 적는다. 되돌린 이유가 다음 사람에게 가장 쓸모 있다
- 커밋 해시를 남긴다. 요약이 틀렸을 때 원본으로 돌아갈 수 있어야 한다
