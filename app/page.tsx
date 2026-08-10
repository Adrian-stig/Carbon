import type { Metadata } from "next";
import CarbonDashboard from "./CarbonDashboard";

export const metadata: Metadata = {
  title: "碳迹 · 上海",
  description: "面向企业员工的每周个人碳足迹记录与减碳建议工具。",
};

export default function Home() {
  return <CarbonDashboard />;
}
