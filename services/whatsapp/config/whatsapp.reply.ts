import _ from "lodash";
import { videoCDN, staticCDN, staticCloudfrontCDN } from "../../../common";
import { Reply } from "../services/dialogues/common/dialogue.interface";
export const replies = {
    unhandledMessage: {
        en: {
            text: "Dear Student,\nAapne kisi purane message ka reply kiya hai jo muje abhi samjh nahi aaraha.\n\nPlease latest message ka hi reply karein.\nYa home button ko daba ke chat phir se shuru karein.",
            footer: "Neeche home button par click karke chat restart karein",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Home" } },
                ],
            },
        },
        hi: {
            text: "प्रिय छात्र,\nआपने किसी पुराने मैसेज का रिप्लाई किया है जो मुझे अभी समझ नहीं आ रहा।\n\nकृपया नए मैसेज का ही रिप्लाई करें।\nया होम बटन पर क्लिक कर के बातचीत फिर से शुरू करें।",
            footer: "नीचे होम बटन पर क्लिक करके बातचीत दोबारा शुरू करें।",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "होम" } },
                ],
            },
        },
    },
    optin: {
        en: `Hello Student,
Welcome to <strong>Doubtnut Family</strong>. 
I am <strong>Doubtnut Buddy</strong>, Your Study Buddy who is going to solve all your questions of <strong>Math</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> and <strong>Biology</strong> in 10 seconds.

To know more watch this short video :
{{0}}`,
        hi: `हैलो छात्र,
<strong>Doubtnut</strong> परिवार में आपका स्वागत है|
मैं हूं <strong>Doubtnut Buddy</strong> आपके <strong>गणित</strong>, <strong>जीव विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>भौतिक विज्ञान</strong> के सभी सवाल <strong>10 सेकेंड</strong> में हल करने वाला आपका पढ़ाई का साथी|

ज़्यादा जानकारी के लिए ये शॉर्ट वीडियो देखें :
{{0}}`,
    },
    searchingForSoln: {
        en: "Good question 😇 🤖 \n\nSearching solution...in 10 secs.. 🔍",
        hi: "अच्छा सवाल 😇🤖 \n\nहल खोज रहे हैं...10 सेकेंड में 🔎",
    },
    askFailure: {
        1: {
            en: "Oh no! 😔\n\nLagta hai system mai kuch problem hai.",
            hi: "अरे नही ! 😔 लगता है सिस्टम में कुछ खराबी है|",
        },
        2: {
            en: "I am fixing it. Pls kuch der mai try karein! 🙂",
            hi: "मैं ठीक कर रहा हूं... कृपया कुछ देर बाद कोशिश करें! 🙂",
        },
    },
    solution: {
        video: {
            en: "<strong>Play Video Solution</strong> ⏯ : 👉 {{url}}",
            hi: "<strong>वीडियो सॉल्यूशन देखें</strong> ⏯ : 👉 {{url}}",
        },
        text: {
            en: "<strong>Open text solution</strong> 🗒 : 👉 {{url}}",
            hi: "<strong>लिखित में सॉल्यूशन देखें</strong> ⏯ : 👉 {{url}}",
        },
    },
    solnFeedback: {
        en: {
            text: "Kya aapko solution mila? 🤖",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "yes",
                        title: "Yes",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "no",
                        title: "No",
                    },
                }],
            },
        },
        hi: {
            text: "क्या आपको हल मिला? 🤖",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "हां",
                        title: "हां",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "नहीं",
                        title: "नहीं",
                    },
                }],
            },
        },
    },
    solnfeedbackRetry: {
        en: {
            text: "Sirf <strong>Yes</strong> OR <strong>No</strong> message karein 😊 \n\nYa phir ek aur question pooche. 🤖 📚",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "yes",
                        title: "Yes",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "no",
                        title: "No",
                    },
                }],
            },
        },
        hi: {
            text: "सिर्फ <strong>हां</strong> और <strong>नहीं</strong> मैसेज करें 😊 या फिर एक और सवाल पूछें 🤖📚",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "हां",
                        title: "हां",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "नहीं",
                        title: "नहीं",
                    },
                }],
            },
        },
    },
    solnNotViewCaption: {
        en: "Kya aapne sawaal poochne ke baad video dekhi? 🤖☝",
        hi: "क्या आपने सवाल पूछने के बाद वीडियो देखी? 🤖☝",
    },
    solnFeedbackYes: {
        feed1: {
            en: "Great! 😊 Pls mere baare mai apne dosto ko bataye. \n\nEk aur question pooche. 📚",
            hi: "बहुत खूब! 😊 कृपया मेरे बारे में अपने दोस्त को बताएं, एक और सवाल पूछें 📚",
        },
        feed2: {
            en: "Great! 😇 \nAsk one more question 🤖",
            hi: "बहुत खूब! 😇 एक और सवाल पूछें 🤖",
        },
        feed3: {
            en: "Kya aapko mere solutions helpful lage? 😇  \n\nPls apne friends ko mere baare mai batao. Forward this message 🙂 \n\n<strong>{{displayNumber}}</strong> par message karo aur apne saare mushkil se mushkil doubts solve karo! \n\n✅ 10 secs mei solution! 🏆 💯 \n\n✅ IITJEE, CBSE & Boards \n\n❌ No Groups  ❌ No Spam\n\n<strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> doubt? 🤔 <strong>{{displayNumber}}</strong> pe {{channelType}} karo!\n\nYa phir, is link par click karo aur doubt poocho 👉 - {{feedbackLink}}",
            hi: "क्या आपको मेरे हल उपयोगी लगे?😇\n\n कृपया अपने दोस्तों को मेरे बारे में बताएं। इस मैसेज को आगे भेजें 🙂 \n\n<strong>{{displayNumber}}</strong> पर मैसेज करो और अपने सारे मुश्किल डाउट्स हल करो!\n\n✅ 10 सेकंड में सॉल्यूशन! 🏆💯\n\n✅IITJEE, CBSE और बोर्ड्स \n\n❌ कोई ग्रुप नही❌ कोई स्पैम नही\n\n<strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> के डाउट्स?? 🤔 <strong>{{displayNumber}}</strong> पे {{channelType}} करो\n\n या फिर, इस लिंक पर क्लिक करो और डाउट पूछो👉 - {{feedbackLink}}",
        },
    },
    solnFeedbackNo: {
        feed1: {
            en: "Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe feedback dein.  🙇‍♂   \nI will improve 😊 \n\nfeedback link 👉 -  https://doubtnut.com/{{channelType}}-rating?qid={{questionId}}&sid={{studentId}}",
            hi: "अरे! माफ करना मैं एक सीखने वाला रोबोट हूं🤖\n\n कृप्या मुझे अपनी प्रतिक्रिया दें 🙇‍♂️\n मैं सुधार करूंगा 😊 \n\n प्रतिक्रिया लिंक 👉 -  https://doubtnut.com/{{channelType}}-rating?qid={{questionId}}&sid={{studentId}}",
        },
        feed2: {
            1: {
                en: "Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.",
                hi: "अरे! माफ करना मैं एक सीखने वाला रोबॉट हूं कृपया एक और मौका दें। \nमैं सीख जाऊंगा😊\n\nमुझसे एक और सवाल पूछें|",
            },
            2: {
                en: "Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ",
                hi: "ऐप पर और ज्यादा खोजें। \nअभी डाउनलोड करें : 👉 https://doubtnut.app.link/RD1Swe7UsZ",
            },
        },
    },
    salutation: {
        sal1: {
            1: {
                en: "I am Doubtnut Buddy. 🤖\n\nAap mujhse <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> ke questions pooch sakte hai.",
                hi: "मैं Doubtnut Buddy हूं\n\nआप मुझसे <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> के सवाल पूछ सकते हो.",
            },
            2: {
                en: "How? 🤔 \n\nStep 1️⃣ - Question ki 📸 photo kheeche \n\nStep 2️⃣ - Sirf one question crop karke send karein",
                hi: "कैसे? 🤔\n\nस्टेप 1️⃣ - सवाल की 📸 खींचे \n\nस्टेप 2️⃣ - सिर्फ एक सवाल क्रॉप कर के भेजें",
            },
            3: {
                en: "Bas 2 steps!\n\nTake photo now 📷  🙂",
                hi: "बस 2 स्टेप\n\nअभी फोटो खींचे 📷 🙂",
            },
        },
        sal2: {
            en: "Oops, yeh to <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> questions nahi hain! 🤔 🤖\nMai sirf <strong>PCMB</strong> doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ",
            hi: "अरे! यह तो <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> के सवाल नही है! 🤔 🤖\nमैं सिर्फ! <strong>PCMB</strong> डाउट्स हल कर सकता हूं 🤓 \n\nआप नई चीज़ें खोजने के लिए मेरा ऐप आजमाएं ! 🙂\nडाउनलोड लिंक : 👉 https://doubtnut.app.link/RD1Swe7UsZ",
        },
        sal3: {
            en: "Lagta hai aap confused hain. 😛\nAb mai sirf <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚",
            hi: "लगता है आप कन्फ्यूज हैं 😛 \nअब मैं सिर्फ <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> डाउट्स पर ही प्रतिक्रिया दूंगा \n\nकिताब से सवाल की फोटो खींचे और मुझे भेजें। आपको तुरंत हल मिल जाएगा 🔎📚",
        },
    },
    randomMessageReply: {
        r1: {
            en: {
                text: "Dear Student,\nAapne kisi purane message ka reply kiya hai jo muje abhi samjh nahi aaraha.\n\nPlease latest message ka hi reply karein.\nYa home button ko daba ke chat phir se shuru karein.",
                footer: "Neeche home button par click karke chat restart karein",
                replyType: "BUTTONS",
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "1", title: "Home" } },
                    ],
                },
            },
            hi: {
                text: "प्रिय छात्र,\nआपने किसी पुराने मैसेज का रिप्लाई किया है जो मुझे अभी समझ नहीं आ रहा।\n\nकृपया नए मैसेज का ही रिप्लाई करें।\nया होम बटन पर क्लिक कर के बातचीत फिर से शुरू करें।",
                footer: "नीचे होम बटन पर क्लिक करके बातचीत दोबारा शुरू करें।",
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "1", title: "होम" } },
                    ],
                },
            },
        },
        r2: {
            en: "Oops, yeh to <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> questions nahi hain! 🤔 🤖\nMai sirf <strong>PCM</strong> doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ",
            hi: "अरे! यह तो <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> के सवाल नही है! 🤔 🤖\nमैं सिर्फ! <strong>PCM</strong> डाउट्स हल कर सकता हूं 🤓 \n\nआप नई चीज़ें खोजने के लिए मेरा ऐप आजमाएं ! 🙂\nडाउनलोड लिंक : 👉 https://doubtnut.app.link/RD1Swe7UsZ",
        },
        r3: {
            en: "Lagta hai aap confused hain. 😛\nAb mai sirf <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚",
            hi: "लगता है आप कन्फ्यूज हैं 😛 \nअब मैं सिर्फ  <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> डाउट्स पर ही प्रतिक्रिया दूंगा \n\nकिताब से सवाल की फोटो खींचे और मुझे भेजें। आपको तुरंत हल मिल जाएगा 🔎📚",
        },
    },
    facts: {
        en: "Oops! Lagta hai mai aapko aaj 5 facts bhej chuka hun. 🤖\n\nAise aur interesting facts ke liye kal phir se mujhe <strong>#Facts</strong> likh ke bheje 😇",
        hi: "अरे! लगता है मैं आपको आज 5 तथ्य भेज चुका हूं 🤖\n\nऐसे और रोचक तथ्यों के लिए कल फिर से मुझे",
    },
    longText: {
        en: {
            text: "Kya ye ek question hai? 🤖",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "yes",
                        title: "Yes",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "no",
                        title: "No",
                    },
                }],
            },
        },
        hi: {
            text: "क्या ये एक प्रश्न है? 🤖",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "हां",
                        title: "हां",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "नहीं",
                        title: "नहीं",
                    },
                }],
            },
        },
    },
    longTextRetry: {
        en: {
            text: "Sirf <strong>Yes</strong> OR <strong>No</strong> message karein 😊 \n\nYa phir ek aur question pooche. 🤖 📚",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "yes",
                        title: "Yes",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "no",
                        title: "No",
                    },
                }],
            },
        },
        hi: {
            text: "सिर्फ <strong>हां</strong> और <strong>नहीं</strong> मैसेज करें 😊 या फिर एक और सवाल पूछें 🤖📚",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "हां",
                        title: "हां",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "नहीं",
                        title: "नहीं",
                    },
                }],
            },
        },
    },
    longTextFalse: {
        en: "Aap mujhse <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> ke questions pooch sakte hai.\n\nHow?🤔\n\nStep 1️⃣ - Question ki 📸 photo kheeche\n\nStep 2️⃣ - Sirf one question crop karke send karein",
        hi: "आप मुझसे <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> & <strong>जीव विज्ञान</strong> के सवाल पूछ सकते हो.\n\nकैसे? 🤔\n\nस्टेप 1️⃣ - सवाल की 📸 खींचे \n\nस्टेप 2️⃣ - सिर्फ एक सवाल क्रॉप कर के भेजें",
    },
    contextImage: {
        en: {
            text: "Jo aapne share kiya hai, kya wo course related hai ya aap Question poochna chahte hein",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "question",
                        title: "Question",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "course",
                        title: "Course",
                    },
                }],
            },
        },
        hi: {
            text: "जो आपने शेयर किया है, क्या वो कोर्स से संबंधित है या आप प्रश्न पूछना चाहते हैं",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "सवाल",
                        title: "सवाल",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "कोर्स",
                        title: "कोर्स",
                    },
                }],
            },
        },
    },
    contextImageRetry: {
        en: {
            text: "Sirf <strong>Question</strong> OR <strong>Course</strong> message karein 😊",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "question",
                        title: "Question",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "course",
                        title: "Course",
                    },
                }],
            },
        },
        hi: {
            text: "सिर्फ <strong>प्रश्न</strong> और <strong>कोर्स</strong> मैसेज करें 😊",
            replyType: "BUTTONS",
            action: {
                buttons: [{
                    type: "reply",
                    reply: {
                        id: "सवाल",
                        title: "सवाल",
                    },
                },
                {
                    type: "reply",
                    reply: {
                        id: "कोर्स",
                        title: "कोर्स",
                    },
                }],
            },
        },
    },
    pdfSuccess: {
        1: {
            en: "Aap mujhse Maths, Physics, Chemistry & Biology ke questions bhi pooch sakte hai.\nHow? 🤔\nStep 1️⃣ - Question ki 📸 photo kheeche\nStep 2️⃣ - Sirf one question crop karke send karein",
            hi: "आप मुझसे गणित, भौतिक विज्ञान, रसायन विज्ञान और जीव विज्ञान के सवाल भी पुछ सकते है.\nकैसे? 🤔\nस्टेप1️⃣ सवाल की 📷 फोटो खीचें\nस्टेप 2️⃣ सिर्फ एक सवाल क्रॉप कर भेज दें",
        },
        2: {
            en: "Bas 2 steps!\nTake photo now 📷  🙂",
            hi: "बस 2 स्टेप्स !\nअभी फोटो खीचें  📷🙂",
        },
    },
    pdfFailure: {
        1: {
            en: "Sorry ☹\nHumare paas iske PDF nahi hai. 😇\nBut Aap mujhse Maths, Physics, Chemistry & Biology ke questions pooch sakte hai.",
            hi: "माफ कीजिए 😔 हमारे पास इसका PDF नहीं है 😇\nलेकिन आप मुझसे गणित, भौतिक विज्ञान, रसायन विज्ञान और जीव विज्ञान के सवाल पूछ सकते हैं",
        },
        2: {
            en: "How? 🤔\nStep 1️⃣ - Question ki 📸 photo kheeche\nStep 2️⃣ - Sirf one question crop karke send karein",
            hi: "कैसे? 🤔\nस्टेप1️⃣ सवाल की 📷 फोटो खीचें\nस्टेप 2️⃣ सिर्फ एक सवाल क्रॉप कर भेज दें,",
        },
        3: {
            en: "Bas 2 steps!\nTake photo now 📷  🙂",
            hi: "बस 2 स्टेप्स !\nअभी फोटो खीचें  📷🙂",
        },
    },
    talkToAgent: {
        en: "Thanks dost. Hum aapko Doubtnut expert se connect kar rhe hein. Wo aapko course ke baare mein saari jaankari de payenge! Meanwhile, aap kabhi bhi <strong>#CourseKharidnaHai</strong> is number pe bhej sakte hein humse baat karne ke liye!",
        hi: "शुक्रिया दोस्त, हम आपको Doubtnut एक्सपर्ट से जोड़ रहे हैं, वो आपको कोर्स के बारे में सारी जानकारी दे पाएंगे! जबकि आप कभी भी <strong>#CourseKharidnaHai</strong> इस नंबर पर भेज सकते हैं हमसे बात करने के लिए!",
    },
    questionPuchoContest: {
        caption: {
            en: "🎙️Badhai ho aap ban chuke hain humare <strong>QUESTION PUCHHO</strong> contest ka hissa.🤩🤩.\n\nIss contest mein har roz 5️⃣0️⃣  <strong>Top Winners</strong> ko milenge 1️⃣5️⃣0️⃣ Rs🤑💸 tak ke <strong>Cash Prize</strong> unke paytm Wallet💰 mein.\n\nContest ki aur jaankari ke liye click on link-\nhttps://app.doubtnut.com/question-pucho",
            hi: "🎙️ बधाई हो आप बन चुके हैं हमारे <strong>सवाल पूछो</strong> प्रतियोगिता का हिस्सा। 🤩🤩 \n\n इस प्रतियोगिता में हर रोज़ 5️⃣0️⃣ <strong>टॉप विजेता</strong> को मिलेंगे 1️⃣5️⃣0️⃣ रुपए 🤑💸 तक के <strong>नकद इनाम<strong>उनके paytm वॉलेट में💰। \n\n प्रतियोगिता को और जानकारी के लिए लिंक पर क्लिक करें link-\nhttps://app.doubtnut.com/question-pucho",
        },
        media: {
            en: `${staticCDN}images/wa_5000cen_comp.jpg`,
            hi: `${staticCDN}images/wa_5000chin_comp.jpg`,
        },
    },
    vendorAdvertisementPostAnswer: {
        caption: {
            en: "{{caption}}",
            hi: "{{caption}}",
        },
        media: {
            en: "{{bannerUrl}}?sid={{studentId}}&screen=whatsapp_new&campaign=oswal_adv_campaign",
            hi: "{{bannerUrl}}?sid={{studentId}}&screen=whatsapp_new&campaign=oswal_adv_campaign",
        },
    },
    home: {
        en: {
            text: "Neeche <strong>Ask a Question</strong> button par click✅ karke aap Question❓❓ puchna jaari rakh sakte hai",
            footer: "Neeche home button par click karke chat restart karein",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            text: "नीचे <strong>सवाल पूछें</strong> बटन पर क्लिक✅ करके आप सवाल ❓❓ पूछना जारी रख सकते हैं",
            footer: "नीचे होम बटन पर क्लिक करके बात दोबारा शुरू करें",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaLengthShort: {
        en: {
            caption: "👆Send ki hui photo mein system ko koi bhi question❓ nahi mil raha hai.\n1️⃣0️⃣ Seconds mein Video Solution📹 pane ke liye question ki clear photo send karein.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "भेजी हुई फोटो में सिस्टम को कोई भी सवाल❓ नहीं मिल रहा है।\n1️⃣0️⃣ सेकेंड में वीडियो सॉल्यूशन📹 पाने के लिए सवाल की साफ़ फोटो भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwritten: {
        en: {
            caption: "Agar 👆 diye hue videos📹 mein aapko apne sawaal ka solution nahi❌ mil raha toh.\n\n1. Apna sawaal saaf tarike📝 se likh kar uska photo send karein.\n2.Apni kitab📖 se sawaal ka photo send karein",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "New image try karein" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: " अगर👆 दिए हुए वीडियो 📹 में आपको अपने सवाल का सॉल्यूशन नहीं ❌ मिल रहा तो\n\n1. अपना सवाल साफ़ तरीके📝 से लिख कर उसका फोटो भेजें।\n2. अपनी किताब📖 से सवाल का फ़ोटो भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "नई फ़ोटो भेजें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwrittenLengthShort: {
        en: {
            caption: "👆Send ki hui hand written photo mein system ko koi bhi question❓ nahi mil raha hai.\n1️⃣0️⃣ Seconds mein Video Solution📹 pane ke liye question ki clear photo send karein.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆भेजी हुई फ़ोटो बहुत धुंधली है और सिस्टम को फ़ोटो में कोई भी सवाल❓नहीं मिल रहा है।\n1️⃣0️⃣ सेकेंड में वीडियो सॉल्यूशन 📹 पाने के लिए सवाल की साफ़ फ़ोटो भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaBlur: {
        en: {
            caption: "Agar 👆 diye hue videos📹 mein aapko apne sawaal ka solution nahi❌ mil raha toh, apne phone se phir se ek clear photo kheech kar send karein.\nAbhi send ki hui photo bahut dhundhali hai",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "New image try karein" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "अगर👆दिए हुए वीडियो 📹 में आपको अपने सवाल का सॉल्यूशन नहीं❌ मिल रहा तो।\n\n1. अपना सवाल साफ़ तरीके📝 से लिखकर उसका साफ़ फ़ोटो खींचकर भेजें।\n2. अपनी किताब 📖 से सवाल का साफ़ फ़ोटो भेजें \n\n अभी भेजी हुई फ़ोटो बहुत धुंधली है",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "नई फ़ोटो भेजें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaBlurLengthShort: {
        en: {
            caption: "👆Send ki hui photo bahut dhundhali hai aur system ko koi photo mein koi bhi question❓ nahi mil raha hai.\n1️⃣0️⃣ Seconds mein Video Solution📹 pane ke liye question ki clear photo send karein.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆हाथ से लिखकर भेजी हुई फोटो बहुत धुंधली है और सिस्टम को फ़ोटो में कोई भी सवाल❓नहीं मिल रहा है।\n1️⃣0️⃣ सेकेंड में वीडियो सॉल्यूशन📹 पाने के लिए साफ़ फ़ोटो खींचकर भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwrittenBlur: {
        en: {
            caption: "Agar 👆 diye hue videos📹 mein aapko apne sawaal ka solution nahi❌ mil raha toh.\n\n1. Apna sawaal saaf tarike📝 se likh kar uska clear photo send karein.\n2. Apni kitab📖 se sawaal ka clear photo send karein.\n\nAbhi send ki hui photo bahut dhundhali hai.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "New image try karein" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "अगर👆दिए हुए वीडियो 📹 में आपको अपने सवाल का सॉल्यूशन नहीं❌ मिल रहा तो।\n\n1. अपना सवाल साफ़ तरीके📝 से लिखकर उसका साफ़ फ़ोटो खींचकर भेजें।\n2. अपनी किताब 📖 से सवाल का साफ़ फ़ोटो भेजें \n\n अभी भेजी हुई फ़ोटो बहुत धुंधली है",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "नई फ़ोटो भेजें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwrittenBlurLengthShort: {
        en: {
            caption: "👆Send ki hui hand written photo bahut dhundhali hai aur system ko koi photo mein koi bhi question❓ nahi mil raha hai.\n1️⃣0️⃣ Seconds mein Video Solution📹 pane ke liye question ki clear photo send karein.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆हाथ से लिखकर भेजी हुई फोटो बहुत धुंधली है और सिस्टम को फ़ोटो में कोई भी सवाल❓नहीं मिल रहा है।\n1️⃣0️⃣ सेकेंड में वीडियो सॉल्यूशन📹 पाने के लिए साफ़ फ़ोटो खींचकर भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl_ls.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwrittenNoSolution: {
        en: {
            caption: "👆Send ki hui hand written photo mein system aapki likhavat nahi samjh paa raha hai.\n\n1. Apna sawaal saaf tarike📝 se likh kar uska photo send karein.\n2. Apni kitab📖 se sawaal ka photo send karein",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆हाथ से लिखकर भेजी हुई फोटो में सिस्टम आपकी लिखावट नहीं समझ पा रहा है को फ़ोटो में कोई भी सवाल❓नहीं मिल रहा है।\n\n1. अपना सवाल साफ़ तरीके📝 से लिखकर उसका फ़ोटो भेजें \n2. अपनी किताब📖 से सवाल का फ़ोटो खींचकर भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaBlurNoSolution: {
        en: {
            caption: "👆Send ki hui photo bahut dhundhali .\n1️⃣0️⃣ Seconds mein Video Solution📹 pane ke liye question ki clear photo send karein.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆 भेजी हुई फ़ोटो बहुत धुंधली है \n1️⃣0️⃣  सेकेंड में वीडियो सॉल्यूशन 📹 पाने के लिए सवाल की साफ़ फ़ोटो भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaHandwrittenBlurNoSolution: {
        en: {
            caption: "👆Send ki hui hand written photo bahut dhundhali.\n\n1. Apna sawaal saaf tarike📝 se likh kar uska clear photo send karein.\n2. Apni kitab📖 se sawaal ka clear photo send karein",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆हाथ से लिखकर भेजी हुई फोटो में सिस्टम आपकी लिखावट नहीं समझ पा रहा है को फ़ोटो में कोई भी सवाल❓नहीं मिल रहा है।\n\n1. अपना सवाल साफ़ तरीके📝 से लिखकर उसका फ़ोटो भेजें \n2. अपनी किताब📖 से सवाल का फ़ोटो खींचकर भेजें",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/hw_bl.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    qaCrop: {
        en: {
            caption: "👆Send ki hui photo mein agar ek se zyada sawaal hai toh photo ko Crop karke resend karein.\n\nAgar send ki hui photo mein ek hi sawaal hai toh kuch dino baad phir se try karein, tab tak hum iss sawaal ka solution bhi system mein add kar denge.",
            footer: "Click clear photo, Crop 1 Question, Send, Get video solution",
            media: `${videoCDN}WHATSAPP/QA-FLOW/cr.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                    { type: "reply", reply: { id: "2", title: "Home" } },
                ],
            },
        },
        hi: {
            caption: "👆भेजी हुई फ़ोटो में अगर एक से ज़्यादा सवाल है तो फ़ोटो को क्रॉप कर के दोबारा भेजें \n\n अगर भेजी हुई फ़ोटो में एक ही सवाल है तो कुछ दिनों बाद फिर से कोशिश करें, तब तक हम इस सवाल का हल भी सिस्टम में जोड़ देंगे।",
            footer: "सवाल की फ़ोटो खींचें, क्रॉप कर भेजें, वीडियो सॉल्यूशन पाएं",
            media: `${videoCDN}WHATSAPP/QA-FLOW/cr.mp4`,
            mediaType: "video",
            replyType: "BUTTONS",
            action: {
                buttons: [
                    { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    { type: "reply", reply: { id: "2", title: "होम" } },
                ],
            },
        },
    },
    noSolution: {
        en: "<strong>NO SOLUTION FOUND</strong>",
        hi: "<strong>कोई हल नहीं मिला है</strong>",
    },
    exactSolution: {
        video: {
            en: "💯% <strong>Match Found</strong>\n\nPlay Video solution ▶️👇\n<strong>{{url}}</strong>",
            hi: "💯% <strong>मैच मिल गया है</strong>\n\n वीडियो सॉल्यूशन चलाएं ▶️👇\n<strong>{{url}}</strong>",
        },
        text: {
            en: "💯% <strong>Match Found</strong>\n\nOpen text solution ▶️👇\n<strong>{{url}}</strong>",
            hi: "💯% <strong>मैच मिल गया है</strong>\n\n लिखित सॉल्यूशन खोलें ▶️👇\n<strong>{{url}}</strong>",
        },
        footer: {
            en: "Upar diye gaye link mein aapke doubt ka exact solution hai",
            hi: "ऊपर दिए गए लिंक में आपके डाउट का सटीक हल दिया गया है",
        },
    },
    freeClassVideo: {
        caption: {
            en: "Video title - {{video_title}}\nClick here to watch👇\n{{video_link}}",
            hi: "वीडियो का विषय- {{video_title}}\n देखने के लिए यहां क्लिक करें👇\n{{video_link}}",
        },
        media: {
            en: `${staticCloudfrontCDN}q-thumbnail/{{question_id}}.png`,
            hi: `${staticCloudfrontCDN}q-thumbnail/{{question_id}}.png`,
        },
        payload: {
            en: {
                mediaType: "image",
                replyType: "BUTTONS",
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "1", title: "Home" } },
                        { type: "reply", reply: { id: "2", title: "Ask a Question" } },
                        { type: "reply", reply: { id: "3", title: "Watch Free Classes" } },
                    ],
                },
            },
            hi: {
                mediaType: "image",
                replyType: "BUTTONS",
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "1", title: "Home" } },
                        { type: "reply", reply: { id: "2", title: "Ask a Question" } },
                        { type: "reply", reply: { id: "3", title: "Watch Free Classes" } },
                    ],
                },
            },
        },
    },
    searchingForFreeClassVideo: {
        en: "<h6>Selected Class - {{selected_class}}</h6>\n<h6>Selected Language - {{selected_language}}</h6>\n<h6>Selected Subject - {{selected_subject}}</h6>\n<h6>Selected Chapter - {{selected_chapter}}</h6>\n\nNeeche aapke selection ke according top videos provided hai😍💯",
        hi: "<h6>चयन की हुई कक्षाएं - {{selected_class}}</h6>\n<h6>चयन की हुई भाषा- {{selected_language}}</h6>\n<h6> चयन किए हुए विषय- {selected_subject}}</h6>\n<h6> चयन किया हुआ पाठ्यक्रम - {{selected_chapter}}</h6>\n\n नीचे आपके चयन के अनुसार टॉप वीडियो दी गई हैं।",
    },
    doubtCharchaResponse: {
        en: "{{response}}",
        hi: "{{response}}",
    },
};

export function localizer(locale: string, msgObj, params?: any) {
    let text = !locale ? msgObj.en : (msgObj[locale] || msgObj.en);
    const template = "{{.[^{}]*}}";
    if (params) {
        const variables = text.match(new RegExp(template, "g")) || [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < variables.length; i++) {
            const variable = variables[i];
            const entity = variable.replace(/{/g, "").replace(/}/g, "");
            const val = (entity === "channelType" && params[entity]) ? params[entity].toLowerCase() : params[entity] ;
            text = text.replace(new RegExp(variable.replace(/\|/g, "\\\|"), "g"), val || entity || "");
        };
    }
    return text;
}
