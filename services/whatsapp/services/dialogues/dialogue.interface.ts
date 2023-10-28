export interface DialogueCondition {
    source: number;
    phone: string;
    studentId: number;
    contextId: string;
    msgId: number;
    entities: { [key: string]: any };
    isFailure?: boolean;
};
