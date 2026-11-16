export default function LoginPage() {
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-card border border-hairline bg-canvas p-8 text-center shadow-float">
      <p className="mb-6 text-display-sm font-bold text-primary">할 일 + 계획 관리</p>
      <h1 className="mb-2 text-display-sm text-ink">로그인</h1>
      <p className="mb-6 text-body-sm text-muted">
        GitHub 계정으로 로그인하면 내 할 일을 관리할 수 있습니다.
      </p>
      {/* Plain link: this is a full-page redirect to GitHub, not a client route. */}
      <a
        href="/auth/github"
        className="flex h-12 w-full items-center justify-center rounded-sm bg-primary px-6 text-body-md font-medium text-on-primary hover:bg-primary-active active:bg-primary-active"
      >
        GitHub로 로그인
      </a>
    </div>
  );
}
