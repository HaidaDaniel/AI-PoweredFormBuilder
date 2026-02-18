interface AlertProps {
    type: "error" | "success";
    message: string;
    onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
    const baseClasses =
        "px-4 py-3 rounded-lg text-sm border transition-all";

    const typeClasses = {
        error:
            "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
        success:
            "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    };

    const classes = `${baseClasses} ${typeClasses[type]}`;

    return (
        <div className={classes}>
            <div className="flex items-center gap-2">
                {type === "success" && (
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
                <span className="font-medium">{message}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto text-current opacity-70 hover:opacity-100"
                        aria-label="Close"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}



