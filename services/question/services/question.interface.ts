export interface OcrResponse {
    ocr: string;
    ocrType?: number;
    source?: string;
    locale?: string;
    handwritten: boolean;
    imageRotation?: number;
    fileName?: string;
    imageConfidence?: number;
}

export interface StringDiffResponse {
    question: {
        id: string;
        ocrText: string;
        subject: string;
    }[];
    extras: {
        queryOcrText: string;
    };
    isIntegral?: number;
    version?: string;
}

export interface AskResponse {
    questionId: string;
    locale?: string;
    isBlur?: boolean;
    isHandwritten?: boolean;
    isExactMatch?: boolean;
    isLengthShort?: boolean;
    results: {
        _id: string;
        resource_type?: string;
        _source: {
            ocr_text: string; is_answered: number; is_text_answered: number; subject: string;
        };
    }[];
}

