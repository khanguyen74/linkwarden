import { VersionResponse } from "@linkwarden/types";
import { useQuery } from "@tanstack/react-query";

export const useGetVersion = () => {
  return useQuery({
    queryKey: ["app-version"],
    queryFn: async (): Promise<VersionResponse> => {
      const response = await fetch("/api/v1/version");
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
};
