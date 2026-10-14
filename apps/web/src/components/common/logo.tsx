import Image from "next/image";

// Tango logo artwork, cropped from design/brand/. The dark-text version
// shows in light mode and the white-text version in dark mode. The hidden one
// stays lazy, so the browser only downloads the variant it shows. The brand
// name is never translated, so the alt text is written here.

// Display size (h-9 = 36px tall) at the artwork's 1497x493 ratio, so next/image
// serves 1x/2x versions of this size rather than the full-size artwork.
const WIDTH = 109;
const HEIGHT = 36;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex ${className}`}>
      <Image
        src="/brand/logo-light.png"
        alt="Tango"
        width={WIDTH}
        height={HEIGHT}
        className="h-9 w-auto dark:hidden"
      />
      <Image
        src="/brand/logo-dark.png"
        alt="Tango"
        width={WIDTH}
        height={HEIGHT}
        className="hidden h-9 w-auto dark:block"
      />
    </div>
  );
}
