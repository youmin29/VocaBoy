<div align="center">

# 🎮 VocaBoy

**레트로 게임기 감성의 JLPT N4 일본어 단어장 앱**

[![Release](https://img.shields.io/github/v/release/youmin29/VocaBoy?style=flat-square)](https://github.com/youmin29/VocaBoy/releases/latest)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20Android-blue?style=flat-square)](https://github.com/youmin29/VocaBoy/releases)
[![Electron](https://img.shields.io/badge/Electron-30-47848f?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)

</div>

---

Game Boy 스타일의 레트로 UI로 JLPT N4 일본어 단어를 재미있게 외울 수 있는 앱입니다. 흑백 LCD 화면, 도트 폰트, 물리 버튼 UI가 특징이며, 데스크탑(Electron)과 Android 모두 지원합니다.

## 기능

- **다중 퀴즈 모드**
  - 의미 퀴즈 — 한자를 보고 한국어 뜻 맞추기
  - 읽기 퀴즈 — 한자를 보고 히라가나 읽기 맞추기
  - 표기 퀴즈 — 히라가나를 보고 한자 맞추기
  - 랜덤 믹스 — 세 가지 유형 섞어서 출제
- **플래시카드** — 단어 넘기기 방식으로 반복 학습
- **단어 목록** — 내장된 N4 단어 171개 전체 보기
- **학습 통계** — 정답률, 연속 정답 스트릭 추적
- **커스텀 단어 추가** — 직접 입력 또는 엑셀(.xlsx) 파일로 단어 일괄 등록 (한자 없는 단어도 등록 가능, 품사 지정 가능)
- **즐겨찾기** — 단어에 ★ 표시 후 즐겨찾기 단어만 퀴즈/플래시카드 출제
- **단어 검색** — 한자·히라가나·한국어 뜻 통합 검색
- **로컬 저장** — SQLite 기반, 학습 기록 영구 보존

## 설치

[Releases](https://github.com/youmin29/VocaBoy/releases/latest) 페이지에서 운영체제에 맞는 파일을 다운로드하세요.

| OS | 파일 |
|---|---|
| macOS | `VocaBoy-Mac-x.x.x-Installer.dmg` |
| Windows | `VocaBoy-Windows-x.x.x-Setup.exe` |
| Linux | `VocaBoy-Linux-x.x.x.AppImage` |
| Android | `app-debug.apk` |

> **macOS 사용자**: 첫 실행 시 "개발자를 확인할 수 없음" 경고가 뜰 수 있습니다. `시스템 설정 → 개인 정보 보호 및 보안 → 확인 없이 열기`에서 허용해 주세요.

> **Android 사용자**: APK 설치 전 `설정 → 보안 → 출처를 알 수 없는 앱 설치 허용`을 켜주세요.

## 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/youmin29/VocaBoy.git
cd VocaBoy/vocaboy

# 의존성 설치
npm install

# 네이티브 모듈 빌드 (better-sqlite3)
npm run rebuild

# 개발 서버 실행
npm run dev
```

## 빌드

```bash
cd vocaboy

# 데스크탑 (Electron)
npm run build

# Android APK
npm run build:android        # 웹 빌드 + Capacitor 동기화
cd android && ./gradlew assembleDebug
```

데스크탑 빌드 결과물은 `release/{버전}/` 디렉토리에, Android APK는 `android/app/build/outputs/apk/debug/`에 생성됩니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| UI | React 18 + TypeScript |
| 스타일 | Tailwind CSS |
| 상태 관리 | Zustand |
| 데스크탑 | Electron 30 |
| 모바일 | Capacitor 7 (Android) |
| DB | better-sqlite3 (SQLite) / localStorage |
| 빌드 | Vite + electron-builder / Gradle |

## 라이선스

MIT
