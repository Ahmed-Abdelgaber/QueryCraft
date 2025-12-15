interface ErrorBannerProps {
    error: string;
    onDismiss: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
    if (!error) return null;

    return (
        <div className="error">
            <strong>Error:</strong> {error}
            <button onClick={onDismiss}>✕</button>
        </div>
    );
}
