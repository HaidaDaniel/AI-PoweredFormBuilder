import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Form Builder" },
    { name: "description", content: "AI-Powered Form Builder" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  throw redirect("/forms");
}

export default function Home() {
  return null;
}
