import { redirect } from "react-router";

export function meta() {
  return [
    { title: "Form Builder" },
    { name: "description", content: "AI-Powered Form Builder" },
  ];
}

export async function loader() {
  throw redirect("/forms");
}

export default function Home() {
  return null;
}
