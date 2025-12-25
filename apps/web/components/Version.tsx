import { useGetVersion } from "@linkwarden/router/version";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { InfoIcon } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function Version() {
  const { data, isLoading } = useGetVersion();
  const { t } = useTranslation();

  if (isLoading || !data) {
    return (
      <div className="mt-auto pt-4 border-t border-base-content/10">
        <div className="flex items-center justify-center gap-2 text-xs text-neutral/60">
          <div className="skeleton h-3 w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto px-4 py-4 border-t border-base-content/10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <InfoIcon className="size-3" />
            <span>Version {data.currentVersion}</span>
          </div>
        </div>

        {data.updateAvailable && (
          <Link
            href={`https://github.com/linkwarden/linkwarden/releases/tag/${data.latestVersion}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div
              role="alert"
              className={cn(
                "flex justify-between w-full flex-1 rounded",
                "py-2 px-3 cursor-pointer transition-all duration-200",
                "border border-info/10 bg-info/5 hover:border-info/30"
              )}
            >
              <p className="text-xs text-info">{data.latestVersion}</p>
              <p className="text-[11px] text-info">{t("update_available")}</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
