import Image from "next/image";
import { Fredoka } from "next/font/google";
import { cn } from "@/lib/utils";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  textClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <Image
        src="/Vocabee.png"
        alt="Vocabee logo"
        width={160}
        height={160}
        priority
        className={cn(
          "h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10",
          imageClassName
        )}
      />

      <div
        className={cn(
          "flex items-baseline leading-none tracking-[-0.04em] font-bold text-2xl sm:text-[1.65rem]",
          fredoka.className,
          textClassName
        )}
      >
        <span className="text-foreground">Voca</span>
        <span className="text-amber-500 dark:text-amber-400">bee</span>
      </div>
    </div>
  );
}
