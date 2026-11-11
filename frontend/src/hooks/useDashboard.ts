import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";

export const useDashboard = () => useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
