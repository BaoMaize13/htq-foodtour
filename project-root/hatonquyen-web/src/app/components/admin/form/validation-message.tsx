import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidationMessageProps {
  type: "error" | "success";
  message: string;
}

export function ValidationMessage({ type, message }: ValidationMessageProps) {
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 text-[12px] ${
      type === "error" ? "text-destructive" : "text-[#2D5A3D]"
    }`}>
      {type === "error" ? (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      )}
      {message}
    </div>
  );
}
