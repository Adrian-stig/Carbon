import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-screen">
      <div className="auth-brand">
        <span className="brand-mark">碳</span>
        <div>
          <strong>碳迹</strong>
          <small>企业邮箱登录</small>
        </div>
      </div>
      <SignIn />
    </main>
  );
}
