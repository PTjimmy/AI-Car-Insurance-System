import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="InsureAI | Create Account"
        description="Create your InsureAI account to manage your insurance policies and claims."
      />

      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}