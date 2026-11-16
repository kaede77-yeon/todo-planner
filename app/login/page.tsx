export default function LoginPage() {
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">로그인</h1>
      <p className="mb-6 text-sm text-gray-600">
        GitHub 계정으로 로그인하면 내 할 일을 관리할 수 있습니다.
      </p>
      {/* Plain link: this is a full-page redirect to GitHub, not a client route. */}
      <a
        href="/auth/github"
        className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        GitHub로 로그인
      </a>
    </div>
  );
}
