interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "elevated";
}

export function Card({ children, className = "", variant = "default" }: CardProps) {
    const baseClasses = "rounded-lg bg-white dark:bg-gray-900";

    const variantClasses = {
        default: "border border-gray-200 dark:border-gray-700",
        elevated: "shadow-md",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return <div className={classes}>{children}</div>;
}


