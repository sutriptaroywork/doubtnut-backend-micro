export interface BaseGupshupEvent {
    sourceNumber: string;
    waNumber: string;
    mobile: string;
    name: string;
    selectedOption?: string;
    timestamp: string;
}

export interface TextEvent extends BaseGupshupEvent {
    text: string;
    type: "text";
}

export interface ImageEvent extends BaseGupshupEvent {
    text: undefined;
    image: string;
    type: "image";
}

export interface InteractiveEvent extends BaseGupshupEvent {
    text?: string;
    interactive: string;
    type: "interactive" | "text";
}

export interface ButtonEvent extends BaseGupshupEvent {
    text?: string;
    button: string;
    type: "button" | "text";
}

export type GupshupEvent = TextEvent | ImageEvent | InteractiveEvent | ButtonEvent;

export interface GupshupImage {
    signature: string;
    mime_type: string;
    url: string;
}

export interface DLREvent {
    externalId: string;
    errorCode: string;
    destAddr: string;
    eventType: string;
}
