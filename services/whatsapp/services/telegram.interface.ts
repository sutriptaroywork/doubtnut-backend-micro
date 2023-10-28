export interface TelegramEvent {
    botName: string;
    update_id: number;
    message: {
        message_id: number;
        from: {
            id: string;
            is_bot: boolean;
            first_name: string;
            language_code: string;
        };
        chat: {
            id: number;
            first_name: string;
            type: "private";
        };
        date: number;
        text: string;
        photo: {
            file_id: string;
            file_unique_id: string;
            file_size: number;
            width: number;
            height: number;
        }[];
        entities: {
            offset: number;
            length: number;
            type: "bot_command";
        }[];
    };
    callback_query?: {
        id: string;
        from: {
            id: string;
            is_bot: boolean;
            first_name: string;
            language_code: string;
        };
        message: {
            message_id: number;
            from: {
                id: string;
                is_bot: boolean;
                first_name: string;
                language_code: string;
            };
            chat: {
                id: number;
                first_name: string;
                type: "private";
            };
            date: number;
            text: string;
            reply_markup: {
                inline_keyboard: [{
                    text: string;
                    callback_data: string;
                }][];
            };
        };
        chat_instance: string;
        data: string;
    };
}
