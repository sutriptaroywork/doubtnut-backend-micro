export interface ShortReply {
    id?: number;
    msg: Function;
    delay?: number;
    conditionFn?: string;
    replyType: string;
}

export interface Reply extends ShortReply {
    delay: number;
    conditionFn: string;
    awaitedIntentId: number;
    isDialogFailure?: boolean;
    replyType: "TEXT" | "DOCUMENT" | "IMAGE" | "VIDEO" | "BUTTONS" | "LIST";
    allowedRetries?: number;
};

export interface DialogueResponse {
    msg: ShortReply[];
    isFailure: boolean;
    continueConversation: boolean;
    allowedRetries?: number;
    interrupted?: boolean;
    intents: {
        current?: { id: number; intent: string; entity?: string; value?: string; selectedOption?: number };
        awaited?: { id: number; intent: string; entity?: string; replyId: number; isOption: boolean };
    };
};