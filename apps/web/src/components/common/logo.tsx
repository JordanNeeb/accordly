import { Momo_Signature } from "next/font/google";

// The "Tango" wordmark stands in for a logo until branding exists. The brand
// name is never translated, so it is written here rather than in messages.
// Momo Signature is loaded here and used nowhere else.
const momoSignature = Momo_Signature({ subsets: ["latin"], weight: "400" });

export function Logo({ className = "" }: { className?: string }) {
  return (
    <p
      className={`${momoSignature.className} text-lg text-indigo-600 dark:text-indigo-400 ${className}`}
    >
      Tango
    </p>
  );
}
