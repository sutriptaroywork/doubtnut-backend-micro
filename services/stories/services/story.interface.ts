import { ObjectId } from "mongodb";

export interface Story {
    _id?: ObjectId;
    caption: string;
    type: string;
    attachment: [string];
    student_id: number;
    class: number;
    profile_image: string;
    username: string;
    is_deleted: boolean;
    is_profane: boolean;
    is_duplicate: boolean;
    is_overflow: boolean;
    view_count: number;
    like_count: number;
    cdn_url: string;
    createdAt: Date;
}

export interface Action {
    _id?: ObjectId;
    type: string;
    student_id: number;
    value: boolean;
    story_id: ObjectId;
    class: number;
    profile_image: string;
    username: string;
    // createdAt: Date;
}

export interface StoriesResponse {
    _id: any;
    student_id: number;
    parent: string;
    profile_image: string;
    username: string;
    class: string;
    story: [Story];
}
