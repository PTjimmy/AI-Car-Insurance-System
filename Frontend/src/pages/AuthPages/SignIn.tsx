import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="InsureAI | Sign In"
        description="Sign in to your InsureAI account to manage your insurance policies and claims."
      />

      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}