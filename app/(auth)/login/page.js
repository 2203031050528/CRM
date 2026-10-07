import AuthForm from "@/app/components/AuthForm";

export const metadata = { title: "Sign in · Simple CRM" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
