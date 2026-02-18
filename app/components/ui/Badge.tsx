interface BadgeProps {
    children: React.ReactNode;
    variant?: "published" | "draft" | "success" | "error" | "default";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded";

    const variantClasses = {
        published:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        draft:
            "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
        success:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        error:
            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        default:
            "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
    };

    const classes = `${baseClasses} ${variantClasses[variant]}`;

    return <span className={classes}>{children}</span>;
}



