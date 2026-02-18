import { Form, redirect, useActionData } from "react-router";
import { useEffect } from "react";
import { getUser, login, loginSchema, createUserSession } from "~/auth/auth.server";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Label } from "~/components/ui/Label";
import { toast } from "sonner";
import type { Route } from "./+types/admin.login";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) {
    throw redirect("/admin/forms");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const user = await login(parsed.data.email, parsed.data.password);
    return createUserSession(user, "/admin/forms", request);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Login failed" };
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Sign In
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </Form>
      </div>
    </main>
  );
}

