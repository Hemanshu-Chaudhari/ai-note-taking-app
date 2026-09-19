import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function Toast({ message, type = "info", onClose, duration = 3500 }) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const icons = {
        success: <CheckCircle2 size={18} className="toast-icon success" />,
        error: <AlertCircle size={18} className="toast-icon error" />,
        info: <Info size={18} className="toast-icon info" />
    };

    return (
        <div className={`toast-notification toast-${type}`}>
            <div className="toast-content">
                {icons[type] || icons.info}
                <span className="toast-text">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Close notification">
                <X size={14} />
            </button>
        </div>
    );
}

export default Toast;
