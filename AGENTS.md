# AGENTS.md (프론트엔드)

## 적용 범위
이 문서는 이 저장소(프론트엔드) 하위의 모든 파일에 적용된다.

## 작업 원칙
- 명시적 요청이 없으면 사용자 흐름과 화면 동작을 바꾸지 않는다.
- 큰 리팩터링보다 작고 안전한 변경을 우선한다.
- 기존 UI 패턴과 디렉토리 구조를 따른다.

## 기술 스택 (package.json 기준)
- Next.js `16.2.4`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `^5`
- Tailwind CSS `^4`
- ESLint `^9`
- `eslint-config-next` `16.2.4`
- `@tailwindcss/postcss` `^4`

## 코드 규칙
- App Router 구조(`app/`)와 기존 컴포넌트 배치를 유지한다.
- 접근성(alt, label, semantic tag)을 훼손하지 않는다.
- API/서버 연동 로직은 `lib/`와 기존 fetch 패턴을 따른다.
- 필요성이 명확하지 않으면 새 의존성을 추가하지 않는다.

## 스타일 규칙
- 스타일은 Tailwind CSS 기준으로 작성한다.
- 인라인 스타일 남용을 피하고 재사용 가능한 클래스 패턴을 우선한다.
- 반응형(모바일/데스크톱) 동작이 깨지지 않도록 확인한다.

## 완료 전 확인 명령
- `npm run lint`
- `npm run build`

## 금지 사항
- 명시적 요청 없이 파괴적 Git 명령(`git reset --hard`, `git checkout --`) 사용 금지
- `.env.local` 실제 값을 직접 수정하지 않는다.

## 결과 보고 형식
- 변경 파일과 사용자 영향 요약
- 실행한 검증 명령과 결과
- 가정 사항과 후속 작업(있다면)
