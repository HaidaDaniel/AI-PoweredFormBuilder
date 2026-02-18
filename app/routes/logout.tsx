import { redirect } from "react-router";
import { logout } from "~/auth/auth.server";
import type { Route } from "./+types/logout";

// Redirect GET requests to login page
export async function loader() {
  return redirect("/admin/login");
}

// POST: destroy session and redirect
export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}


