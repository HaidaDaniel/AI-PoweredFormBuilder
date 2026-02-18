import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", className = "", disabled, children, ...props }, ref) => {
        const baseClasses =
            "px-4 py-2 font-medium rounded-lg transition-colors disabled:cursor-not-allowed";

        const variantClasses = {
            primary:
                "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
            secondary:
                "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50",
            danger:
                "border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50",
        };

        const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

        return (
            <button ref={ref} className={classes} disabled={disabled} {...props}>
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

