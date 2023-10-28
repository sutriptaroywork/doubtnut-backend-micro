export interface NetcoreEvent {
    message_id: string;
    from: string; // with country code
    received_at: string;
    message_type: "TEXT" | "IMAGE";
    image_type?: {
        sha256: string;
        mime_type: string;
        id: string;
    };
    text_type?: {
        text: string;
    };
}

export interface NetcoreMsg {
    sourceNumber: string;
    incoming_message: NetcoreEvent[];
};
