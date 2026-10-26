import type { Metadata } from "next";
import { climateJusticeReport as report } from "./report-content";
import ReportReader from "./ReportReader";

export const metadata: Metadata = {
  title: `${report.title} | Re-Model Intelligence`,
  description: report.purpose,
};

export default function ReportPage() {
  return <ReportReader />;
}
