# 2D 애니메이션 인계 — 2026-09-13

## 먼저 읽을 내용

사용자는 2D 방향을 선택했고 추가 원화 제작을 더 맡기지 말라고 했다. 캐릭터 외형은 사용자 제공 원본을 유지한다. 남은 동작 제작은 개발자가 맡는다. 훅 접촉·가드·위빙을 완성했다고 보고하지 않는다. 마지막 요청은 현재 작업을 마무리하고 다음 세션에서 이어갈 수 있게 남기는 것이다.

원본 10장과 UI·두 자세 시안은 `97ac4a6`에 커밋했다. 이후 프레임 작업은 별도 체크포인트 커밋이다. 원격 푸시 요청은 없었다.

## 자료 위치

- 캐릭터 원본 3장: `docs/art/reference/character-user/` (초기 가드, 수정 가드, 스트레이트). `sources.json`에 원본 파일명·바이트·SHA-256.
- 동작 참고 7장: `docs/art/reference/boxing-user/`. 개발 참고 전용, 게임 배포에 포함하지 않는다.
- 기존 외형 기준: `docs/art/reference/link/README.md`와 실제 로컬 이미지. 사용자 그림이 현재 구현의 직접 기준이다.
- 새 프레임 작업장: `assets/animation/cel-frames-v1/`. 원본 스트립·추출 프레임·아틀라스·명세·검수 기록.
- 게임용 복사본: `dist/assets/cel-boxer/animation/`.

## 현재 상태

| 동작 | 상태 |
| --- | --- |
| 가드 | 4프레임. 독립 정지 프레임 검수·자동 추출 QA 통과. 게임 연결됨. 실제 재생 검수 미완료 |
| 위빙 | 6프레임. 무릎 낮추기·전진·중간 복귀. 독립 정지 프레임 검수·자동 QA 통과. 게임 연결됨. 실제 재생 검수 미완료 |
| 훅 | 2차 4프레임은 굽힘/외형 통과. 앱 내 브라우저에서 75% 자세를 보니 주먹이 카메라 쪽으로 향해 상대 얼굴에 닿지 않음. 게임 적용 비활성화, 검수 화면에만 표시 |
| 잽/크로스 | 사용자 스트레이트 한 장을 공유하는 기존 임시 표현. 앞손·뒷손 구별 미완료 |
| 바디 훅/오버핸드/하단 가드/피격/KO 등 | 전용 새 프레임 미완료. 기존 두 그림의 임시 변형/가드 사용 |

**중요:** `prompts/hook.txt`는 아직 실행하지 않은 3차 프롬프트다. `raw/hook.png`는 2차 결과다. 프롬프트를 재작성했다는 이유로 새 이미지가 생성된 것으로 오해하지 않는다. 3차는 상대가 있는 화면 오른쪽으로 전완과 글러브가 향하고 팔꿈치는 굽히도록 요청한다.

첫 훅(팔이 펴짐)과 첫 위빙(갑작스러운 복귀)은 `rejected/`에 보존했다. 수정 훅 2차도 접촉 위치 때문에 탈락 후보로 보존했다.

## 구현 경계

- `dist/ring.js`: `?art=cel`에서만 CelRing. 기본 주소는 기존 픽셀 표현 유지.
- `dist/cel-animation.js`: 엔진의 동작 phase와 progress를 manifest의 프레임으로 변환. 훅의 접촉은 1.5박 기준. 전투 판정 시간은 바꾸지 않는다.
- `dist/ring-cel.js`: atlas 사각형으로 렌더. `presentation.rows[state].enabled_in_game`이 false이면 게임에서 사용하지 않는다. `showCandidates:true`는 검수 화면 전용.
- `tools/animation/export_cel_frames.py`: 추출/아틀라스 QA 통과 확인 후 파일 복사와 시각 랜드마크 작성. 훅 비활성화가 이 코드에도 반영됨. 훅 재검수 통과 전에는 켜지 않는다.
- `dist/animation-study.html`, `dist/animation-study.js`: 동작 선택·진행 슬라이더·중심 자세·재생. 전투 계산과 분리된 검수 화면.
- 엔진 `dist/engine.js`는 변경하지 않음.

## 바로 이어할 순서

1. `git status --short --branch`로 체크포인트 확인. 기존 미추적 `.agents/`, `.specify/`, `specs/`, `docs/development/`, 거절된 Blender 스터디를 정리/삭제하지 않는다.
2. imagegen·sprite-gen 스킬을 읽고 훅 3차 생성. 기준은 `base-source.png`와 훅 layout guide, 수치는 `sprite-request.json`, 프롬프트는 `prompts/hook.txt`. 내장 이미지 생성이 다시 동작한다. 사용자에게 추가 그림을 요청하지 않는다.
3. 스트립을 `raw/hook.png`에 보존하고 sprite-gen 추출/compose/preview 도구로 처리. `qa-notes.md`에 결과 기록. 프레임 실패를 단순 리사이즈나 재생 순서 조작으로 통과시키지 않는다.
4. 가드/위빙도 실제 재생을 검수. 훅은 팔꿈치 굽힘뿐 아니라 상대 방향과 실제 접촉 거리 확인. 인물 비율·발 위치·행 전환 크기·복귀 확인.
5. 통과한 동작만 게임 활성화. `npm test`, `git diff --check`, 실제 카드 선택/실행/다음 교환 복귀 확인 후 다음 커밋.

## 실행 명령 (WSL)

저장소: `/mnt/c/Users/82105/Documents/ChatGPT/fcm`

```bash
python3 -m http.server 8000 --bind 0.0.0.0 --directory dist
# 게임: http://localhost:8000/?art=cel
# 동작 검수: http://localhost:8000/animation-study.html
```

sprite-gen 도구는 `/mnt/c/Users/82105/.codex/skills/sprite-gen/scripts/`에 있다.

```bash
python3 /mnt/c/Users/82105/.codex/skills/sprite-gen/scripts/extract_sprite_row_frames.py --run-dir assets/animation/cel-frames-v1
python3 /mnt/c/Users/82105/.codex/skills/sprite-gen/scripts/compose_sprite_atlas.py --run-dir assets/animation/cel-frames-v1
python3 /mnt/c/Users/82105/.codex/skills/sprite-gen/scripts/preview_animation.py --run-dir assets/animation/cel-frames-v1
python3 tools/animation/export_cel_frames.py
python3 /mnt/c/Users/82105/.codex/skills/sprite-gen/scripts/serve_curation.py --run-dir assets/animation/cel-frames-v1 --lang ko --no-open
npm test
git diff --check
```

프레임 셀은 576×768. 작은 셀에서 프레임별 축소율이 달라져 웅크린 자세의 신체 비율이 커지는 문제가 있어 확대했다. 픽셀화 옵션은 끄고 기존 셀 일러스트 유지. 런타임 축척은 행 전체 동일.

## 브라우저/운영

- 앱 내 브라우저 연결 성공, 훅 접촉 자세 캡처로 거리 문제 확인.
- Chrome 연결은 한때 끊겨 luna medium 에이전트가 복구 시도. 화면 제어 도구가 URL 정책 확인 오류로 중단. 이후 사용자가 Chrome을 직접 켰다고 알림. **그 뒤 연결 재확인은 아직 안 함.**
- 외부 브라우저는 Chrome. Computer Use가 필요하면 사용자 요청대로 `gpt-5.6-luna`, medium 하위 에이전트 사용.
- 마지막 로컬 서버 세션은 8000, curation 포트는 37593이었다. 다음 세션까지 프로세스가 살아 있다고 가정하지 않는다.
- `/caveman` 적용 중: 한국어로 짧게 보고. 코드는 정상 가독성 유지.
