# Football Manager 벤치마킹

> 대상: Football Manager 시리즈 (FM26 기준 최신 확인 자료 포함)
> 목적: FCM의 선수 데이터, 성장, 잠재력, 스카우팅 및 정보 비대칭 시스템 설계를 위한 참고 문서
> 상태: 선수 시스템 중심 1차 리서치. 이후 훈련/계약/관계/대회/세계 시뮬레이션 등 계속 확장 예정.

---

## 1. 이 게임을 벤치마킹하는 이유

Football Manager의 핵심 강점은 단순히 선수 능력치 수가 많은 것이 아니라, 하나의 선수를 둘러싼 여러 시스템이 장기적으로 연결된다는 점이다.

선수 발견 → 정보 수집 → 능력 평가 → 영입 판단 → 훈련 → 출전 → 성장/쇠퇴 → 위상 변화 → 계약/이적이라는 흐름이 하나의 커리어 서사를 만든다.

FCM에서 특히 참고할 부분은 다음과 같다.

- 선수 능력을 다차원 Parameter로 표현하는 구조
- 현재 능력과 잠재 능력의 분리
- 잠재력이 곧 미래 결과를 보장하지 않는 구조
- 외부 선수 정보가 처음부터 완전히 공개되지 않는 Attribute Masking
- 스카우트의 능력과 조사 정도에 따라 정보 정확도가 달라지는 구조
- 절대적인 내부 값과 플레이어에게 보여주는 상대적 평가를 분리하는 구조

---

## 2. 선수 능력치 구조

Football Manager는 선수의 능력을 여러 개의 세부 Attribute로 분해한다.

일반적으로 선수 프로필의 능력치는 기술적 능력, 정신적 능력, 신체적 능력 등의 범주로 나뉘며 각 Attribute는 개별 수치로 관리된다.

중요한 설계 포인트는 "종합 능력치 하나"가 선수를 정의하는 것이 아니라는 점이다.

예를 들어 비슷한 전체 수준의 선수라도 세부 능력치 분포가 다르면 역할과 경기 방식이 크게 달라진다.

### FCM 관점

FCM도 Overall 수치 하나가 전투력을 직접 결정하게 하기보다 다음 구조가 적합하다.

- 실제 전투 계산은 세부 Parameter를 참조
- UI의 Overall 또는 등급은 사용자가 선수를 빠르게 비교하기 위한 요약값
- 동일 Overall이라도 전혀 다른 격투 스타일의 선수가 존재하도록 설계

---

## 3. Current Ability와 Potential Ability

Football Manager 내부에는 선수의 현재 수준을 나타내는 Current Ability(CA)와 최대 성장 가능 수준을 나타내는 Potential Ability(PA)가 존재한다.

CA는 현재 Attribute 상태와 연결되는 동적인 개념이고, 선수 성장이나 노화에 따라 변화한다.

PA는 선수가 도달할 수 있는 성장 한계를 정의하지만, PA가 높다고 해서 반드시 그 수준까지 성장하는 것은 아니다.

실제 성장은 연령, 훈련 환경, 출전 기회, 각종 내부 요인 등에 의해 달라질 수 있다.

### 핵심 설계 효과

이 구조 덕분에 다음과 같은 선수가 가능하다.

- 현재는 약하지만 성장 가능성이 매우 큰 유망주
- 현재는 강하지만 성장 여지가 거의 없는 완성형 선수
- 잠재력은 높지만 제대로 성장하지 못한 실패한 유망주
- 낮게 평가받았지만 기대 이상으로 성장한 선수

### FCM 관점

FCM의 핵심 재미가 "내가 발굴한 선수를 괴물로 키우는 것"이므로 현재 능력과 잠재 능력의 분리는 매우 잘 맞는다.

다만 FM처럼 PA가 사실상 고정 천장으로 존재할지, 성장 과정의 성취에 따라 일부 확장 가능한지 여부는 별도 결정이 필요하다.

---

## 4. 플레이어에게 내부 능력을 그대로 보여주지 않는다

Football Manager에서 CA와 PA의 실제 내부 수치는 일반적인 플레이 화면에서 직접 제공되지 않는다.

대신 코치/스카우트가 현재 수준과 미래 가능성을 별점이나 리포트 형태로 평가한다.

즉 게임 내부에는 정확한 값이 존재하지만 플레이어는 그 값을 직접 보는 대신 "평가 정보"를 받는다.

이 구분은 FCM 스카우팅에서 특히 중요하다.

### 내부 데이터와 관측 데이터 분리

예시 구조:

- True Stat: 게임 엔진이 사용하는 실제 선수 능력
- Known Stat: 플레이어가 현재 알고 있는 정보
- Estimated Stat: 스카우트가 추정한 능력 범위
- Confidence: 해당 평가의 신뢰도

FCM에서 이 네 층을 분리하면 유망주 발굴 시스템을 깊게 만들 수 있다.

---

## 5. Attribute Masking과 정보 비대칭

FM에서는 Attribute Masking을 사용할 경우 충분히 조사하지 않은 외부 선수의 능력치가 정확한 숫자로 보이지 않는다.

일부 능력치는 범위로 표시되거나 정보가 부족한 상태가 된다.

스카우팅이 진행되면서 선수에 대한 지식이 증가하고 더 정확한 평가를 얻는다.

이 구조의 핵심은 능력치 자체보다 "정보를 획득하는 과정"이 게임플레이가 된다는 점이다.

### FCM 적용 예시

처음 발견한 지하 파이터:

- Punch Power: ???
- Kick Power: 중간 이상으로 추정
- Cardio: ???
- Grappling: 낮음~높음
- Potential: B~S 추정

훈련 관찰, 스파링, 실제 경기, 전문 스카우팅 등을 거치면 범위가 좁아지고 최종적으로 정확한 수치에 가까워지는 구조가 가능하다.

---

## 6. 스카우트 평가 자체가 오차를 가진다

Football Manager는 선수 평가를 절대적인 진실로 바로 제시하지 않고 스카우트와 코치의 평가 능력을 통과시켜 보여준다.

현재 능력을 판단하는 능력과 잠재 능력을 판단하는 능력은 별개의 평가 역량으로 취급된다.

따라서 같은 선수를 보더라도 평가자의 수준이나 정보량에 따라 결과가 달라질 수 있다.

### FCM에서 중요한 점

FCM에서도 "스카우팅 완료 = 정답 공개" 구조보다 다음 구조가 더 적합하다.

- 관찰만 한 경우: 넓은 추정 범위
- 실제 경기 관찰: 경기에서 드러난 능력의 신뢰도 상승
- 스파링 테스트: 특정 Parameter를 집중 평가
- 전문 스카우트: 잠재력 평가 정확도 상승
- 장기간 보유: 실제 능력에 거의 근접한 정보 확보

즉 스카우팅은 단순한 대기 시간이 아니라 어떤 방식으로 선수를 조사할지 선택하는 시스템이 될 수 있다.

---

## 7. 상대 평가 방식

FM의 별점은 절대적인 세계 공통 등급이라기보다 현재 팀 수준, 평가자, 정보 상태 등의 영향을 받는 상대적 평가로 사용된다.

이것은 플레이어가 숫자 하나만 보고 모든 선수를 정렬하는 것을 어렵게 만든다.

### FCM 적용 가능성

FCM에서도 다음 두 정보를 분리할 수 있다.

- 엔진 내부의 절대 Parameter
- 플레이어에게 보여주는 현재 환경 기준 평가

예를 들어 지하 파이트클럽에서는 A급으로 평가받던 선수가 국제 리그에 진출하면 C급 선수로 평가될 수 있다.

이 방식은 Part 1 → Part 2로 게임 스케일이 확장될 때 특히 유용하다.

---

## 8. 성장의 불확실성

FM에서 Potential Ability는 최대 가능성을 의미할 뿐 실제 성장을 보장하지 않는다.

선수는 높은 잠재력을 가져도 환경과 커리어 진행에 따라 기대만큼 성장하지 못할 수 있다.

이 구조는 유망주 육성에 다음 감정을 만든다.

- 기대
- 투자 판단
- 실패 위험
- 예상 밖의 성공
- 장기간 육성한 선수에 대한 애착

FCM의 핵심 목표와 직접적으로 연결되는 부분이다.

---

## 9. FCM이 그대로 복제하면 안 되는 부분

Football Manager는 매우 많은 데이터와 현실 축구 데이터베이스를 기반으로 하기 때문에 정보량 자체가 콘텐츠가 된다.

FCM은 1인 개발 프로젝트이므로 같은 방향으로 세부 수치를 무한히 늘리는 것은 적합하지 않다.

오히려 필요한 것은 다음이다.

1. 적은 수의 중요한 Parameter
2. 모든 Parameter가 전투 엔진에서 명확한 역할을 가짐
3. 성장시키면 경기 화면에서 변화가 느껴짐
4. 선수 프로필을 잠깐 보는 것만으로 스타일을 어느 정도 파악 가능
5. 깊이는 Parameter 개수가 아니라 상호작용과 정보 비대칭에서 확보

---

## 10. FCM에 가져올 후보 시스템

### 강하게 참고

- 현재 능력 / 잠재 능력 분리
- 내부 실제 값과 사용자 관측값 분리
- Attribute Masking
- 능력치를 범위로 표시하는 초기 스카우팅
- 조사량에 따른 정보 신뢰도 증가
- 현재 능력 평가와 잠재력 평가의 분리
- 성장 가능성이 실제 성장을 보장하지 않는 구조

### 변형해서 참고

- 별점 기반 Overall 평가
- 상대적인 팀 수준 기반 평가
- 평가자의 능력에 따른 오차

### FCM에서 단순화할 부분

- 지나치게 많은 Attribute
- 선수 성격/심리 Hidden Attribute의 복잡한 조합
- 대규모 스태프 조직을 전제로 한 스카우팅 관리

FCM은 앞선 인터뷰에서 별도 성격 시스템을 사용하지 않기로 했으므로 선수의 플레이 차이는 Parameter + Skill Card + Ring Name으로 표현한다.

---

## 11. FCM 설계 질문으로 이어지는 쟁점

Football Manager 벤치마킹 결과 다음 항목을 인터뷰로 확정해야 한다.

- 선수 Parameter의 총 개수와 분류 방식
- Overall을 실제 엔진 값으로 사용할지 단순 UI 요약값으로 사용할지
- Potential을 고정 상한으로 둘지 변화 가능한 값으로 둘지
- Potential을 하나의 숫자로 둘지 각 능력별 성장 한계로 둘지
- 스카우팅 전 능력치를 완전히 숨길지 범위로 보여줄지
- 자신의 소속 선수가 된 이후 실제 Parameter를 완전히 공개할지
- 스카우트/코치의 평가 오류를 어느 정도 허용할지
- 선수의 성장 속도를 별도 Hidden Parameter로 관리할지

---

## Sources

- Football Manager 공식: Recruitment Revamp
  - https://www.footballmanager.com/features/recruitment-revamp
- Football Manager 공식: Starting Your First Save in FM26 (Attribute Masking 옵션 확인)
  - https://www.footballmanager.com/the-dugout/starting-your-first-save-fm26
- Football Manager 공식: FM26 Update 26.2 (CA/PA/Attribute 데이터 업데이트 확인)
  - https://www.footballmanager.com/news/fm26-update-262-now-live
- FM Scout: Current and Potential Ability Guide
  - https://www.fmscout.com/a-football-manager-current-and-potential-ability-guide.html
- FMInside: Current & Potential Ability
  - https://fminside.net/guides/positional-guides/76-current-potential-ability
- FMInside: Player Attributes
  - https://fminside.net/guides/basic-guides/28-player-attributes-in-football-manager
- FM Dossier: Scouting & Fog of War
  - https://fmdossier.dev/guides/scouting-and-fog-of-war

---

## 리서치 신뢰도 메모

- 공식 Football Manager 자료를 우선 근거로 사용했다.
- CA/PA 내부 구조 및 세부 동작은 커뮤니티/전문 가이드 자료를 보조적으로 사용했다.
- 게임 버전에 따라 UI와 일부 세부 규칙은 변할 수 있으므로 FCM 설계 시 개념적 벤치마크로 사용한다.
