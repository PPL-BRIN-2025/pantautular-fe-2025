import Image from "next/image";
import clsx from "clsx";

type DefaultThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

const DEFAULT_IMAGE_SRC = "/images/news-default.png";

const DefaultThumbnail = ({ src, alt, className, priority = false }: DefaultThumbnailProps) => {
  const resolvedSrc = typeof src === "string" && src.trim() !== "" ? src : DEFAULT_IMAGE_SRC;

  return (
    <div className={clsx("relative w-full overflow-hidden rounded-t-xl bg-gray-100", className)}>
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
          className="object-cover"
          priority={priority}
        />
      </div>
    </div>
  );
};

export default DefaultThumbnail;
