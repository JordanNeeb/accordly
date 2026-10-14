import { Momo_Signature } from "next/font/google";

import { AuthMessages } from "@/lib/auth/messages";

// The "Tango" wordmark stands in for a logo until branding exists. Momo
// Signature is loaded here and used nowhere else.
const momoSignature = Momo_Signature({ subsets: ["latin"], weight: "400" });

export function Logo({ className = "" }: { className?: string }) {
  return (
    <p
      className={`${momoSignature.className} text-lg text-indigo-600 dark:text-indigo-400 ${className}`}
    >
      {AuthMessages.appName}
    </p>
  );
}
