# 두 갈래 작업 — 누가 무엇을 건드리나

> 이 저장소는 지금 **두 환경에서 병렬로** 진행된다.
> 자기 갈래를 확인하고, 남의 파일은 건드리지 않는다.

| 갈래 | 환경 | 맡는 것 |
|---|---|---|
| **전투·시스템** | Claude cowork | 전투 판정, 밸런스, 보정 도구, 커리어·세계, 그 시스템을 보여주는 UI |
| **애니메이션·표현** | ChatGPT work | 모션 곡선, 스프라이트, 링 렌더링, 아트 |

두 갈래가 만나는 지점은 **엔진이 내보내는 이벤트 하나뿐**이다.
그 경계만 지키면 서로를 기다릴 필요가 없다.

---

# 1. 경계 — 엔진은 수치를 내보내고, 렌더러는 그것을 읽는다

```text
engine.resolveTurn(...)  →  { match, frames, plans }
                               frames[i] = { tick, poses, events, fighters, finished }

                                            ↓  읽기만 한다

sampleMotion(pose, progress, now, index, events, ko, reduced)   모션 곡선
pixelFrame(pose, progress, events, index, ko)                   스프라이트 인덱스
describeEvent(event, { fighters })                              문구
```

**단방향이다.** 렌더러가 판정에 영향을 주지 않고, 엔진은 표시 문구를 만들지 않는다.
`docs/design/37`이 이 규칙을 명시하고, 테스트가 강제한다
(`엔진이 표시 문구를 만들지 않는다`, `app.js에 번역 대상 문구가 없다`).

애니메이션 쪽이 필요한 것이 이 이벤트에 없다면 **엔진에 필드를 추가해 달라고 요청**한다.
렌더러가 카드 id를 보고 전투 결과를 추측하지 않는다.

---

# 2. 파일 소유

## 전투·시스템 (Claude cowork)

```
dist/engine.js  fighter.js  fighter-schema.js  knowledge.js  combat-memory.js
dist/policy.js  equilibrium.js  plan-space.js  planner.js  difficulty.js
dist/campaign.js  career.js  club.js  organisation.js  scouting.js  world.js
dist/growth.js  save.js  rng.js  events.js  definitions.js
config/**                       (strings/ 제외)
tools/**
docs/spec/**  docs/guide/**  docs/design/22 ~ 38
tests/**                        (motion.test.mjs 제외)
```

## 애니메이션·표현 (ChatGPT work)

```
dist/motion.js  pixel-motion.js  ring.js  ring-pixel.js
assets/**
docs/design/20  21a  21b
docs/art/**
tests/motion.test.mjs
```

## 공유 — 만지기 전에 확인

| 파일 | 왜 공유인가 | 규칙 |
|---|---|---|
| `dist/app.js` | 컨트롤러. 양쪽이 다 부른다 | 자기 영역 함수만 고친다. `hud`·`renderIntel`·`renderDeck`은 시스템 쪽, `beginPlayback`·재생 루프는 애니메이션 쪽 |
| `dist/index.html` | 뼈대와 도움말 | 자기가 추가한 요소만 |
| `dist/style.css` | 전부 여기 | 자기가 추가한 선택자만 |
| `config/strings/ko.json` | 사용자 문구 | 키를 **추가만** 한다. 남의 키를 지우지 않는다 |
| `dist/commentary.js` | 이벤트 → 문구 | 새 이벤트 종류가 생기면 시스템 쪽이 추가한다 |

**충돌을 줄이는 가장 확실한 방법은 각자 브랜치를 쓰고 자주 합치는 것이다.**
같은 브랜치에서 동시에 작업하면 `dist/app.js`와 `style.css`에서 반드시 부딪힌다.

---

# 3. 애니메이션 쪽 첫 과제 — 카드 7장이 움직이지 않는다

9월 12~13일에 카드가 12종에서 19종으로 늘었다. **모션은 따라오지 않았다.**

`dist/motion.js`의 `ATTACKS` 집합과 `dist/pixel-motion.js`의 인라인 배열이
카드 id를 **하나하나 열거**하고 있어서, 새 카드는 조용히 기본 자세로 떨어진다.

측정 결과 — 모션 변화 없음, 스프라이트 0번(기본) 고정:

```
flicker  advance  backstep  stepin  switch  sidestep_left  sidestep_right
```

| 카드 | 무엇을 표현해야 하나 |
|---|---|
| `flicker` | 플리커 잽. 잽보다 멀리 뻗고 빠르게 거둔다 |
| `advance` | 전진 훅. 한 발 파고들며 훅 — 거리 −0.6으로 가장 크게 좁힌다 |
| `backstep` | 뒤로 한 발. 공격도 방어도 하지 않는다 |
| `stepin` | 앞으로 한 발 |
| `switch` | 스탠스 전환. 앞발과 뒷발이 바뀐다 |
| `sidestep_left` / `sidestep_right` | 옆으로 돌아 각을 튼다. **좌우가 눈에 보여야 한다** |

마지막 것이 특히 중요하다. 사이드 스텝은 **어느 쪽으로 도는지가 카드의 전부**이고
(`docs/design/22`), 방향을 잘못 고르면 그쪽 손 훅에 1.6배로 맞는다.
두 장이 화면에서 구분되지 않으면 플레이어는 자기가 무엇을 골랐는지 알 수 없다.

## 이 부류의 버그를 막는 법

같은 실수가 덱 UI에서도 있었다 — 분류 필터가 카드 종류를 열거해서
`backstep`·`stepin`·`switch`가 **아예 선택 불가**였다. 배제 방식으로 바꾸고
"모든 카드가 정확히 한 분류에 있다"를 테스트가 강제하게 했다.

애니메이션 쪽도 같은 가드를 두는 것이 좋다:
**모든 카드가 기본 자세와 다른 모션을 가진다**를 `tests/motion.test.mjs`에서 단언하면,
다음에 카드가 늘 때 조용히 빠지지 않는다.

---

# 4. 전투·시스템 쪽 다음 할 일

[`dev/BACKLOG.md`](BACKLOG.md)에 항목별로 정리되어 있다.
이어받는 법은 [`dev/RESUME.md`](RESUME.md).

---

# 5. 양쪽 모두 지킬 것

- **판정은 표현을 모른다.** 엔진에 문구·색·좌표가 들어가면 안 된다
- **표현은 판정을 바꾸지 않는다.** 모션 시간은 카드 안에서만 흐르고 전투 입력이 아니다
- 사용자 문구는 전부 `config/strings/ko.json`. 코드에 한글을 박지 않는다
  (검증 메시지는 예외 — 설계 문서의 검증 기준과 1:1로 대응하므로 원문을 유지한다)
- `npm test`가 통과하지 않는 상태로 푸시하지 않는다
