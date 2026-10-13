import { redirect } from "next/navigation";

// The profile is the signed-in home until families exist (feature 5); the
// proxy sends signed-out visitors on to /sign-in.
export default function Home() {
  redirect("/profile");
}
