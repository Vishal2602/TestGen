import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function isJavaScriptFile(file: File): boolean {
  const extension = getFileExtension(file.name).toLowerCase();
  return extension === "js" || extension === "ts" || extension === "jsx" || extension === "tsx";
}

export function isMarkdownFile(file: File): boolean {
  const extension = getFileExtension(file.name).toLowerCase();
  return extension === "md" || extension === "txt";
}

export function getCategoryNameDisplay(category: string): string {
  const categoryMap: Record<string, string> = {
    whitebox_statement: "Statement Coverage",
    whitebox_branch: "Branch Coverage",
    whitebox_path: "Path Coverage",
    blackbox_boundary: "Boundary Value Analysis",
    blackbox_equivalence: "Equivalence Partitioning"
  };
  
  return categoryMap[category] || category;
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "bg-neutral-200 text-neutral-700",
    in_progress: "bg-primary-100 text-primary-700",
    completed: "bg-success-500 text-white",
    failed: "bg-error-500 text-white"
  };
  
  return statusMap[status] || "bg-neutral-200 text-neutral-700";
}

export function getStatusIcon(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "ri-time-line text-neutral-400",
    in_progress: "ri-loader-4-line text-primary-500 animate-spin",
    completed: "ri-checkbox-circle-fill text-success-500",
    failed: "ri-error-warning-fill text-error-500"
  };
  
  return statusMap[status] || "ri-time-line text-neutral-400";
}

export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 90) return "bg-success-500 text-white";
  if (confidence >= 70) return "bg-primary-500 text-white";
  return "bg-neutral-500 text-white";
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return "High";
  if (confidence >= 70) return "Medium";
  return "Low";
}
