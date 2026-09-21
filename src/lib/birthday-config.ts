import type { BirthdayConfig } from "@/types/birthday";

/**
 * Central personalization layer.
 * Swap names, stories, photos, gifts — keep the voice sounding like you, not a template.
 */
export const birthdayConfig: BirthdayConfig = {
  recipient: {
    name: "Sumaiya",
    fullName: "Sumaiya Jannat",
    nickname: "Vutta",
    dearName: "Janu",
    birthday: "September 22, 2003",
    age: 23,
  },

  sender: {
    name: "Ratul",
    fullName: "Ratul Saha Roy",
  },

  hero: [
    {
      kicker: "pull to ignite",
      greeting: "Hey Sumaiya.",
      subtitle: "Something is waiting.",
      hint: "Tap the handle, or pull it down.",
      revealClosing: "Got you.",
    },
    {
      kicker: "don’t peek — pull",
      greeting: "So… you showed up.",
      subtitle: "I was getting impatient.",
      hint: "Pull it. Don’t overthink it.",
      revealClosing: "Finally.",
    },
    {
      kicker: "one pull away",
      greeting: "Sumaiya, hi.",
      subtitle: "I owe you this one.",
      hint: "Give it a pull.",
      revealClosing: "Let’s go.",
    },
    {
      kicker: "your turn",
      greeting: "Right on time.",
      subtitle: "This one’s all yours.",
      hint: "Pull the handle down.",
      revealClosing: "This is yours.",
    },
    {
      kicker: "almost ready",
      greeting: "There you are.",
      subtitle: "I’ve been saving this.",
      hint: "Pull down. Trust me.",
      revealClosing: "It begins.",
    },
  ],

  letter: {
    intro: "starting with this",

    body: [
      "Janu,",

      "Today, I’m celebrating your 6th birthday since you came into my life. And honestly, when I look back at these six years, so many things have happened between us — things that are now nothing but beautiful memories.",

      "I honestly don’t know how to express everything I feel. Sometimes I feel like I simply don’t have enough words to explain what you mean to me. But the day I found you, a completely new journey began in my life. I was genuinely so happy to have you. I never thought that one day I would actually have someone like you in my life.",

      "To me, you have always been such a cute, innocent, baby-like person. And if I had never gotten the chance to have you this close to me, I think there would always have been a little emptiness in my heart — a feeling that I had missed something I had always wished for.",

      "But at least, I got you. I got to have you close to me. I got to tell you the things in my heart, to express how I feel about you, and to share everything with you exactly the way I wanted. And honestly, that alone means so much to me.",

      "I don’t know if this is going to be your last birthday celebration with me or not. Maybe it is, maybe it isn’t. But knowing that I got to experience your cuteness in my own way, to be close to you and make memories with you, makes me incredibly, incredibly happy.",

      "You have been through so much in your life. There was even a time when you were so lost and broken that you didn’t really know what you were doing or where you were going. And somehow, I always found a strange kind of peace in being there for you, protecting you from the wrong paths, pointing out your mistakes, and trying to save you from hurting yourself.",

      "Of course, there were things you did in between that you probably shouldn’t have done, and those things hurt me more than you may ever realize. I wish you hadn’t done some of them. I wish things could have been different.",

      "But maybe you should understand how much I love you, because if someone keeps getting hurt by the same person, a breakup would normally be the natural thing to happen. Yet I always accepted your mistakes, stayed beside you, and tried to help you become a better version of yourself.",

      "That was always my goal — not to control you, but to make sure you never did something that would hurt yourself or destroy your own life.",

      "Anyway, enough of all that.",

      "You are still one of the most special girls I have ever had in my life. Your cuteness has always mesmerized me. There is something about your cute face, your charm, and the way you are that I can never really explain.",

      "I love your cuteness. I love your charming face. Honestly, I love all those little things about you more than you probably realize.",

      "So, my baby, my jaan — please love me a little more. ❤️",

      "But always remember one thing: sooner or later, we may have to be apart from each other. And I know that is going to hurt. Maybe more than we can imagine right now.",

      "Still, no matter what happens, please know that I have loved you, I love you, and a part of me will always love you.",

      "Happy birthday, my jaan.",
      "Happy birthday, my baby. ❤️",

      "I love you always.",
    ],

    signoff: "Love, Ratul",
  },

  memories: [
    {
      id: "m1",
      src: "/photo/IMG_20220825_131639.jpg",
      alt: "A memory with Sumaiya",
      caption: "We were so loud that day. Zero regrets.",
    },
    {
      id: "m2",
      src: "/photo/IMG_20230818_173604.jpg",
      alt: "A memory with Sumaiya",
      caption: "Forgot whose idea this was. Still think about it though.",
    },
    {
      id: "m3",
      src: "/photo/IMG_20231019_170536.jpg",
      alt: "A memory with Sumaiya",
      caption: "Celebrating something tiny like it was huge. Peak us.",
    },
    {
      id: "m4",
      src: "/photo/IMG_20231020_140414_1.jpg",
      alt: "A memory with Sumaiya",
      caption: "You almost blew the candles out wrong. Classic.",
    },
    {
      id: "m5",
      src: "/photo/IMG_20231020_152455.jpg",
      alt: "A memory with Sumaiya",
      caption: "Didn't plan anything. Somehow that was the plan.",
    },
    {
      id: "m6",
      src: "/photo/IMG_20231111_153526.jpg",
      alt: "A memory with Sumaiya",
      caption: "Bad playlist. Great company. Would do it again.",
    },
    {
      id: "m7",
      src: "/photo/IMG_20231111_171411.jpg",
      alt: "A memory with Sumaiya",
      caption: "This one I keep coming back to.",
    },
    {
      id: "m8",
      src: "/photo/020231111_143815807_8.4.400.jpg",
      alt: "A memory with Sumaiya",
      caption: "We didn't even notice the camera.",
    },
    {
      id: "m9",
      src: "/photo/IMG_20240229_152250.jpg",
      alt: "A memory with Sumaiya",
      caption: "A leap day. That felt right somehow.",
    },
    {
      id: "m10",
      src: "/photo/IMG_20240416_161826.jpg",
      alt: "A memory with Sumaiya",
      caption: "Random afternoon. Somehow still memorable.",
    },
    {
      id: "m11",
      src: "/photo/20240830_170718.jpg",
      alt: "A memory with Sumaiya",
      caption: "Late August. The light was different that day.",
    },
    {
      id: "m12",
      src: "/photo/WhatsApp Image 2024-09-03 at 21.00.24_2b1c2d5a.jpg",
      alt: "A memory with Sumaiya",
      caption: "Sent at 9 PM. Still makes me smile.",
    },
    {
      id: "m13",
      src: "/photo/ac8dff8f-7a66-4e83-9074-91c3ac652a32.jpg",
      alt: "A memory with Sumaiya",
      caption: "I saved this one for a reason.",
    },
    {
      id: "m14",
      src: "/photo/Screenshot 2026-09-21 223855.png",
      alt: "A memory with Sumaiya",
      caption: "Even the little things count.",
    },
    {
      id: "m15",
      src: "/photo/Screenshot 2026-09-21 223940.png",
      alt: "A memory with Sumaiya",
      caption: "Every single one of them. Ours.",
    },
  ],

  specialCards: [
    {
      title: "That smile",
      text: "Weirdly effective. Fixes my mood without asking.",
    },
    {
      title: "The chaos",
      text: "Exhausting. Also the funniest part of knowing you.",
    },
    {
      title: "How you care",
      text: "You show up. Quietly. Consistently. It counts.",
    },
    {
      title: "Just… you",
      text: "Days make more sense when you’re in them.",
    },
  ],

  balloons: {
    kicker: "one for every year",
    startHint: "First one. It’s already trying to get away.",
    midHint: "They don’t sit still. Catch this one.",
    endHint: "Last few. Don’t let this one drift off.",
    doneKicker: "every single year",
    doneBody: "Loud, a little messy, and completely yours.",
    cta: "To the cake",
  },

  audio: {
    trackSrc: "/audio/birthday.mp3",
    initialVolume: 0.55,
  },

  spinner: {
    maxSpins: 6,
    mode: "guaranteed",

    guaranteedGiftIds: [
      "churi-3",
      "churi-2",
      "gold-bangles",
      "kitkat",
      "exotic",
      "lipstick",
    ],

    gifts: [
      {
        id: "iphone",
        label: "iPhone 15 Pro Max",
        shortLabel: "iPhone",
        description: "The big one. Titanium, the works.",
        imageSrc: "/gifts/iphone.webp",
        color: "#F4E6D4",
      },
      {
        id: "apple",
        label: "1 Apple",
        shortLabel: "Apple",
        description: "One apple. The fruit.",
        imageSrc: "/gifts/apple.webp",
        color: "#C44732",
      },
      {
        id: "cinema",
        label: "Cinema / Movie",
        shortLabel: "Cinema",
        description: "Tickets and popcorn. You pick the film.",
        imageSrc: "/gifts/cinema.webp",
        color: "#E7C56A",
      },
      {
        id: "dress",
        label: "A beautiful dress",
        shortLabel: "Dress",
        description: "The dress. I already know the one.",
        imageSrc: "/gifts/dress.webp",
        color: "#6E2A22",
      },
      {
        id: "bangles-1",
        label: "1 dozen Kashmiri bangles",
        shortLabel: "1 dozen",
        description: "A dozen Kashmiri bangles.",
        imageSrc: "/gifts/bangles.webp",
        color: "#F4E6D4",
      },
      {
        id: "churi-3",
        label: "3 dozen Kashmiri churi",
        shortLabel: "3 dozen",
        description: "Three dozen Kashmiri churi. The whole stack.",
        imageSrc: "/gifts/churi-3.webp",
        color: "#C44732",
      },
      {
        id: "churi-2",
        label: "2 dozen Kashmiri churi",
        shortLabel: "2 dozen",
        description: "Two dozen Kashmiri churi.",
        imageSrc: "/gifts/churi-2.webp",
        color: "#E7C56A",
      },
      {
        id: "gold-bangles",
        label: "Golden bangles",
        shortLabel: "Gold",
        description: "The gold ones. Heavy, in a good way.",
        imageSrc: "/gifts/gold.webp",
        color: "#6E2A22",
      },
      {
        id: "kitkat",
        label: "KitKat",
        shortLabel: "KitKat",
        description: "The chocolate. Break it however you want.",
        imageSrc: "/gifts/kitkat.webp",
        color: "#F4E6D4",
      },
      {
        id: "good-girl",
        label: "Good Girl perfume",
        shortLabel: "Good Girl",
        description: "Good Girl. The heel bottle.",
        imageSrc: "/gifts/good-girl.webp",
        color: "#C44732",
      },
      {
        id: "exotic",
        label: "Layering Lab Body Mist",
        shortLabel: "Paradise",
        description: "Paradise. It stays on you.",
        imageSrc: "/gifts/exotic.webp",
        color: "#E7C56A",
      },
      {
        id: "lipstick",
        label: "Long Stay Lip Crayon",
        shortLabel: "Lip Crayon",
        description: "The lipstick. I already chose the shade.",
        imageSrc: "/gifts/lipstick.webp",
        color: "#6E2A22",
      },
      {
        id: "earrings",
        label: "Ear ring",
        shortLabel: "Earrings",
        description: "A pair. For whenever you feel like it.",
        imageSrc: "/gifts/earrings.webp",
        color: "#F4E6D4",
      },
      {
        id: "speaker",
        label: "Bluetooth speaker",
        shortLabel: "Speaker",
        description: "Bluetooth. Loud enough for the kitchen.",
        imageSrc: "/gifts/speaker.webp",
        color: "#C44732",
      },
    ],
  },

  final: {
    headline: "Okay. That’s the whole thing.",
    body: [
      "Wheel, balloons, cake. You actually did all of it.",
      "The stuff on the table is yours. Tomorrow is the part I want.",
    ],
    closing: "I’m glad it’s you.",
  },
};

export function getPublicGifts(config: BirthdayConfig = birthdayConfig) {
  return config.spinner.gifts.map(
    ({ id, label, shortLabel, description, imageSrc, color }) => ({
      id,
      label,
      shortLabel,
      description,
      imageSrc,
      color,
    })
  );
}
