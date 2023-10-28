export interface WordDetails {
    word: {
        text: string;
        localized?: string;
        phonetic?: string;
        audio_url?: string;
    };
    meanings: any;
    powered_by_text?: string;
    additional_words?: string;
}
