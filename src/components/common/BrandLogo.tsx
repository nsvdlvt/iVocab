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
  subtitleClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/Vocabee.png"
        alt="Vocabee logo"
        width={160}
        height={160}
        priority
        className={cn("h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14", imageClassName)}
      />

      <div className={cn("flex flex-col items-start justify-center leading-none text-left", fredoka.className, textClassName)}>
        <div className="flex items-baseline gap-0 font-extrabold tracking-[-0.06em] text-[1.9rem] sm:text-[2.2rem] md:text-[2.5rem]">
          <span className="text-[#030f31] dark:text-white">Voca</span>
          <span className="text-[#f9971d]">bee</span>
        </div>
        <div
          className={cn(
            "mt-[2px] w-full pl-[0.14em] text-left text-[0.42rem] font-medium tracking-[0.3em] text-[#030f31] sm:text-[0.46rem] md:text-[0.5rem]",
            subtitleClassName
          )}
        >
          
        </div>
      </div>
    </div>
  );
}
