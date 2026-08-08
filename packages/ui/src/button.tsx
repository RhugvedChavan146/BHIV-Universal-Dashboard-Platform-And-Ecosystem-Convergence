import * as React from "react";
import { cn } from "@bhiv/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border border-indigo-500/30",
      secondary: "bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/40",
      destructive: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30",
      outline: "border border-slate-700 hover:bg-slate-800 text-slate-300",
      ghost: "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent",
      link: "text-indigo-400 hover:underline p-0 h-auto bg-transparent border-none",
    };

    const sizeStyles = {
      default: "h-8 px-3 text-xs",
      xs: "h-6 px-2 text-[10px]",
      sm: "h-7 px-2.5 text-xs",
      lg: "h-10 px-4 text-sm",
      icon: "h-8 w-8 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
