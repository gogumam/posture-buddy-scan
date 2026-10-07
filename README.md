# Posture Pal

골반/자세 비대칭 분석 및 운동 가이드 웹앱의 MVP를 만들어줘.

목표:
사용자가 스마트폰 카메라로 자신의 자세를 촬영하거나 사진을 업로드하면, 현재는 실제 의료 진단이 아니라 '자세 비대칭 스크리닝'을 체험할 수 있는 프로토타입이다. 향후 웨어러블 IMU 센서와 연동할 수 있도록 데이터 구조와 UI를 확장 가능하게 설계한다.

핵심 화면:
1. 홈/대시보드
- 오늘의 자세 상태 요약
- 좌우 어깨 높이, 골반 좌우 높이 차이, 몸통 기울기 같은 예시 지표
- "자세 측정 시작" CTA
- 최근 측정 기록과 변화 추이

2. 자세 측정
- 정면/측면 촬영 안내
- 카메라 권한을 요청할 수 있는 UI
- MVP에서는 실제 컴퓨터비전 분석 API가 없어도 되므로 업로드한 이미지/카메라 화면을 기반으로 한 데모 분석 흐름을 구현
- 분석 전 준비 자세 체크리스트: 맨발, 편안한 자세, 전신이 화면에 들어오기, 정면/측면
- 결과는 '진단'이라는 표현 대신 '자세 분석 결과' 또는 '스크리닝 결과'라고 표시
- 신뢰도가 낮으면 재측정 안내

3. 분석 결과
- 골반 기울기/좌우 비대칭, 어깨 높이 차이, 체중 이동/몸통 기울기 등의 지표를 시각적으로 표시
- 좌우 차이를 막대/게이지로 보여주기
- 정상/주의 같은 강한 의료 판정 대신 '비대칭 낮음/관찰 필요' 정도의 중립적인 표현
- 각 지표가 무엇을 의미하는지 쉽게 설명
- 통증이나 증상이 있으면 의료 전문가 상담을 권고하는 안전 문구

4. 교정/운동 가이드
- 분석 결과에 따라 추천 운동 카드
- 예: 둔근 강화, 고관절 가동성, 코어 안정화, 햄스트링 스트레칭
- 운동별 자세/횟수/세트/주의사항
- 사용자가 완료 체크
- 운동은 개인 맞춤 '추천'이지 치료나 교정 보장으로 표현하지 않음

5. 기록
- 날짜별 측정 결과
- 골반 좌우 차이와 몸통 기울기의 변화 그래프
- 운동 수행률
- 주간 리포트

디자인:
- 모바일 우선, 실제 스마트폰에서 쓰기 좋은 앱 같은 UI
- 깔끔하고 신뢰감 있는 헬스케어 디자인
- 너무 의료기관처럼 딱딱하지 않게
- 한국어 UI
- 카드, 게이지, 간단한 인체 실루엣/골반 시각화를 적극 활용
- 접근성 좋은 큰 버튼

향후 웨어러블 확장을 고려:
- 센서 데이터 모델을 timestamp, sensor_id, accel_x/y/z, gyro_x/y/z, roll/pitch/yaw 등의 형태로 확장할 수 있게 설계
- 향후 BLE IMU 센서 또는 스마트워치 데이터를 받을 수 있는 Sensor Data 페이지를 별도로 추가할 수 있도록 구조화
- 현재는 가상 센서 데이터로 '센서 연동 준비' 화면만 제공

중요:
- 실제 의료 진단/질병 판정을 하지 않는다는 문구를 명확하게 표시
- 카메라 분석은 MVP 데모이며 실제 정확한 자세 추정 모델이 연결되지 않은 경우 그 사실을 사용자에게 명확히 알림
- 개인정보 보호를 고려해 사진 데이터는 기본적으로 저장하지 않는 방향의 UI/설계를 선호

가능하면 실제 작동하는 반응형 프로토타입으로 만들어줘.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1d23c76-d593-4e80-99f9-30afee1e9e9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
