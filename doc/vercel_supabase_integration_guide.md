# Vercel & Supabase 배포 및 연동 가이드 (트러블슈팅 포함)

이 문서는 **Big History AI Platform**을 배포하는 과정에서 겪은 **시행착오와 해결 방법**을 포함한 **실전 가이드**입니다.
추후 재배포하거나 다른 프로젝트를 진행할 때, 같은 실수를 반복하지 않도록 **"우리가 겪은 문제들(Mistakes)"**을 중점적으로 기록했습니다.

---

## 1. 사전 준비 (필수 환경 변수)

배포 전, 아래 3가지 키가 준비되어 있어야 합니다.

1.  **Supabase Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
2.  **Supabase Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3.  **Google AI API Key** (`GOOGLE_GENERATIVE_AI_API_KEY`)

> **💡 실수 포인트 (Mistake #1)**:
> Vercel 프로젝트를 **새로 만들거나(Re-create) 덮어쓸 때**, 기존에 입력했던 환경 변수가 **초기화**됩니다.
> 배포가 실패하면 무조건 **[Settings] -> [Environment Variables]** 부터 확인해야 합니다.

---

## 2. GitHub 업로드 (Git Setting)

### 핵심 과정
1.  작업한 코드를 GitHub Repository에 업로드합니다.
2.  `.gitignore` 파일을 통해 불필요하거나 용량이 큰 파일은 제외해야 합니다.

### ⚠️ 중요: 대용량 파일 문제 (Mistake #2)
**문제 상황**: 로컬에서는 잘 돌아가는데, `git push` 할 때 `File exceeds 100MB` 에러가 발생하며 업로드 실패.
**원인**: `data/15.pdf` 같은 대용량 파일이 Git 기록에 포함되었기 때문.
**해결책**:
1.  `.gitignore`에 `data/*.pdf` 추가.
2.  **과거 기록 삭제(History Clean)**: 이미 한 번이라도 커밋했다면, 단순 삭제로는 안 됨.
    ```bash
    # 현재 상태만 남기고 과거 기록(대용량 파일 이력)을 모두 날리는 명령어 (Orphan Branch)
    git checkout --orphan new-main
    git add .
    git commit -m "Clean Deployment"
    git branch -D main
    git branch -m main
    git push -u origin main --force
    ```

---

## 3. Vercel 프로젝트 생성 및 설정

### 핵심 과정
1.  Vercel 대시보드에서 **[Add New Project]** 클릭.
2.  **[Import]** 할 때 정확한 Repository 선택 (`GoogleAntiGravity-Bighistory`).

### ⚠️ 중요:  
**문제 상황**: 배포를 했는데 `404 Not Found`가 뜨거나, 빌드가 아예 시작되지 않음.
**원인**: 코드가 최상위 폴더가 아니라 `big-history-platform`이라는 **하위 폴더**에 들어있는데, Vercel은 기본적으로 최상위만 보기 때문.
**해결책**:
1.  Vercel 설정 단계(**Configure Project**)에서
2.  **Root Directory** 항목 옆의 `Edit` 클릭.
3.  `big-history-platform` 폴더를 직접 선택 또는 입력.
4.  **Framework Preset**이 자동으로 **`Next.js`**로 바뀌는지 확인. (안 바뀌면 경로 틀린 것임)

### ⚠️ 중요: 저장소 연결 실수 (Mistake #4)
**문제 상황**: 코드를 수정해서 GitHub에 올렸는데, Vercel은 반응이 없음 ("No Production Deployment").
**원인**: 이름이 비슷한 **다른 저장소(예: `GoogleAntiGravity`)**를 실수로 연결함.
**해결책**:
1.  Vercel **[Settings] -> [Git]** 메뉴 확인.
2.  연결된 저장소 이름이 정확한지(`-Bighistory`가 붙었는지) 확인.
3.  틀렸다면 **Disconnect** 후 다시 **Connect**.

---

## 4. 최종 배포 및 트리거 (Trigger)

### 핵심 과정
1.  설정이 완료되면 **[Deploy]** 버튼 클릭.
2.  "Congratulations!" 화면이 뜨면 성공.

### ⚠️ 중요: 배포가 트리거되지 않을 때 (Mistake #5)
**문제 상황**: 환경 변수나 설정을 바꿨는데도 `Redeploy` 버튼이 안 눌리거나 반응이 없음.
**원인**: Vercel UI 오류이거나, 변경 사항이 감지되지 않음.
**해결책**:
1.  **빈 커밋으로 강제 신호 보내기**:
    ```bash
    git commit --allow-empty -m "Trigger Vercel Build"
    git push
    ```
2.  또는 **`README.md` 같은 가벼운 파일 내용을 한 글자 수정**해서 Push.
3.  **[Deployments]** 탭에서 **[Redeploy]** 메뉴(점 3개 버튼)를 수동으로 클릭.

---

## 요약 체크리스트 (다음에 배포할 때)

- [ ] **.gitignore 확인**: 대용량 PDF 파일이 제외되었는가?
- [ ] **Root Directory**: `big-history-platform` 폴더를 지정했는가?
- [ ] **Environment Variables**: API Key 3개가 정확히 들어갔는가?
- [ ] **Repository Check**: 내가 작업한 그 저장소가 맞는가?

이 가이드를 따르면 다음번 배포는 **5분** 안에 끝낼 수 있습니다! 🚀
