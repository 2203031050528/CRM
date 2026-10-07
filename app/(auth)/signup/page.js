import AuthForm from "@/app/components/AuthForm";

export const metadata = { title: "Sign up · Simple CRM" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
