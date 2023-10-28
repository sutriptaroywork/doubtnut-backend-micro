/* eslint-disable no-underscore-dangle */
import vision from "@google-cloud/vision";
import Enum from "enum";
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {ObjectId} from "mongodb";
import moment from "moment";
import studyGroupData from "../data/studygroup.data";
import Settings from "./settings";


const ImageProfanity: ServiceSchema = {
    name: "$image-profanity",
    mixins: [Settings],
    methods: {

        async isImageDirty(data: any) {
            try {
                const imageWidget = new Enum(["widget_asked_question", "image_card"]);
                // check if message widget_type is of image or not
                if (data.message.widget_data && data.message.widget_data.child_widget && !imageWidget.isDefined(data.message.widget_data.child_widget.widget_type)) {
                    return true;
                }

                // extracting the image url
                let image = null;
                if (_.has(data.message, "widget_data.child_widget.widget_data.question_image")) {
                    image = data.message.widget_data.child_widget.widget_data.question_image;
                } else if (_.has(data.message, "widget_data.child_widget.widget_data.image_url")) {
                    image = data.message.widget_data.child_widget.widget_data.image_url;
                }
                const isImageProfaned = image && await this.isImageProfaned(image);

                if (isImageProfaned) {
                    // Image is profane, replacing it with warning message
                    data.message.widget_data.child_widget = studyGroupData.profanityImageStructure;
                    data.message.widget_data.type = 1;
                    data.updated_at = moment().add(5, "hours").add(30, "minutes").toDate();

                    const collectionType = data.room_id.split("-")[0];
                    let messageCollection;

                    if (collectionType === "sc") {
                        messageCollection = this.settings.studyChatMessageCollection;
                    } else {
                         messageCollection = collectionType === "sg" ? this.settings.messageCollection : this.settings.publicMessageCollection;
                    }

                    await this.adapter.db.collection(messageCollection).updateOne({_id: new ObjectId(data._id)}, {
                        $set: {
                            message: data.message,
                            updated_at: data.updated_at,
                        },
                    });

                    // pushing updated value in kafka for archival
                    this.pushArchivalData(this.settings.ArchivalConsumerTopic, data);

                    // storing profane data in another collection
                    const profaneObj = {
                        message_id: new ObjectId(data._id),
                        widget_type: 2, // For Image Profanity
                        image,
                        student_id: data.student_id,
                        room_id: data.room_id,
                        room_type: data.room_type,
                        created_at: data.updated_at,
                    };
                    await this.broker.call("profanity.abusivePost", profaneObj);
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async isImageProfaned(imageUri: string) {
            try {
                let isProfaned = false;
                const client = new vision.ImageAnnotatorClient();
                const request = {
                    image: {
                        source: {imageUri},
                    },
                };
                const checkedImage = await client.safeSearchDetection(request);
                if (checkedImage[0].safeSearchAnnotation && this.settings.profaneStatus.isDefined(checkedImage[0].safeSearchAnnotation.adult)) {
                    // Image is profane
                    isProfaned = true;
                }
                return isProfaned;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

    },
};

export = ImageProfanity;
