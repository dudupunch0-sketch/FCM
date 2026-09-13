# 2D 동작 프레임 제작

기준: 사용자가 제공한 수정 가드 원본 `base-source.png`. 원본 보관은 `docs/art/reference/character-user/`.

## 재생성

`sprite-request.json`과 `prompts/`는 제작 수치와 동작 요구사항이다. 내장 이미지 생성 도구로 자세별 가로 스트립을 생성해 `raw/`에 보존한다. 생성 이미지는 최종 아틀라스가 아니다.

로컬 sprite-gen 스킬의 `scripts/`에서 다음 순서로 실행한다. 각 명령의 `--run-dir`은 이 폴더다.

1. `extract_sprite_row_frames.py`: 크로마 제거와 컴포넌트별 프레임 추출
2. `compose_sprite_atlas.py`: 아틀라스와 프레임 사각형 명세
3. `preview_animation.py`: 접촉 시트와 GIF
4. 저장소의 `python3 tools/animation/export_cel_frames.py`: 검증된 아틀라스와 명세를 게임용 폴더로 복사

셀은 576×768. 최초 384×512 추출은 프레임마다 축소율이 달라 위빙의 신체 비율이 변했으므로 채택하지 않았다. 큰 셀에 원본 크기로 수용하고, 런타임은 각 행 전체에 동일한 축척을 적용한다. 웅크린 프레임을 서 있는 프레임과 같은 높이로 늘리지 않는다.

`manifest.json.frame_layout`이 런타임 사각형의 기준이다. `presentation.json`의 부위 좌표는 시각 효과용 근사값이며 전투 판정과 무관하다.

최초 훅과 위빙은 `rejected/`에 보존했다. 훅은 팔이 펴져 보였고 위빙은 깊은 자세에서 바로 일어나므로 탈락했다. 수정본은 훅 4프레임, 상단 가드 4프레임, 위빙 6프레임이다.

훅 수정 생성에는 사용자가 제공한 `punch-comparison.png`를 동작 참고로 추가 첨부했다. 얼굴과 의상은 가드 원본만 기준으로 사용했다. 사용자에게 추가 그림을 요청하지 않는다.

검수 화면: `/animation-study.html`. 게임 시안: `/?art=cel`.
