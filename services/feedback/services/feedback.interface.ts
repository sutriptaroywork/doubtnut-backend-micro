import { ObjectId } from "mongodb";

export interface Feedback {
    _id?: ObjectId;
    reason: string;
    type: string;
    student_id: number;
    mobile: string;
    country_code: string;
    email: string;
    class: number;
    username: string;
    country: string;
}
