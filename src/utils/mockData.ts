import type { Tweet } from '../types';

export const mockTweets: Tweet[] = [
  {
    id: '1',
    author: {
      id: '1',
      username: 'elonmusk',
      displayName: 'Elon Musk',
      avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yGsN4J5Q_400x400.jpg',
      verified: true,
      followersCount: 150000000,
      followingCount: 100,
    },
    content: 'Twitter is now X. The everything app is coming.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likesCount: 45000,
    retweetsCount: 12000,
    repliesCount: 8500,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: '2',
    author: {
      id: '2',
      username: 'sundarpichai',
      displayName: 'Sundar Pichai',
      avatar: 'https://pbs.twimg.com/profile_images/1572692188940939265/6lQhJW3P_400x400.jpg',
      verified: true,
      followersCount: 5000000,
      followingCount: 500,
    },
    content: 'Excited to share our latest AI advances at Google I/O. The future of search is here with generative AI.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likesCount: 25000,
    retweetsCount: 8000,
    repliesCount: 3200,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: true,
  },
  {
    id: '3',
    author: {
      id: '3',
      username: 'satyanadella',
      displayName: 'Satya Nadella',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 3000000,
      followingCount: 200,
    },
    content: 'AI is the defining technology of our time. At Microsoft, we are committed to building AI responsibly and making it accessible to everyone.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likesCount: 18000,
    retweetsCount: 5500,
    repliesCount: 2100,
    isLiked: false,
    isRetweeted: true,
    isBookmarked: false,
  },
  {
    id: '4',
    author: {
      id: '4',
      username: 'tim_cook',
      displayName: 'Tim Cook',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 12000000,
      followingCount: 300,
    },
    content: 'Privacy is a fundamental human right. At Apple, we build products that protect your personal information by design.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likesCount: 32000,
    retweetsCount: 9000,
    repliesCount: 4500,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: '5',
    author: {
      id: '5',
      username: 'jeffbezos',
      displayName: 'Jeff Bezos',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 5000000,
      followingCount: 100,
    },
    content: 'Blue Origin is making progress on New Glenn. The future of space exploration is bright.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likesCount: 15000,
    retweetsCount: 4000,
    repliesCount: 1800,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: '6',
    author: {
      id: '6',
      username: 'billgates',
      displayName: 'Bill Gates',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 60000000,
      followingCount: 200,
    },
    content: 'Just finished reading "The Coming Wave" by Mustafa Suleyman. A must-read for anyone thinking about AI and the future.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    likesCount: 22000,
    retweetsCount: 6500,
    repliesCount: 2800,
    isLiked: true,
    isRetweeted: true,
    isBookmarked: true,
  },
  {
    id: '7',
    author: {
      id: '7',
      username: 'jack',
      displayName: 'Jack Dorsey',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 6000000,
      followingCount: 5000,
    },
    content: 'Building on Bitcoin. The open protocol for the internet of value.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likesCount: 12000,
    retweetsCount: 3500,
    repliesCount: 1500,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: '8',
    author: {
      id: '8',
      username: 'vitalikbuterin',
      displayName: 'Vitalik Buterin',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
      followersCount: 5000000,
      followingCount: 2000,
    },
    content: 'Ethereum scaling is progressing well. Rollups are the future and they are here now.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    likesCount: 18000,
    retweetsCount: 5000,
    repliesCount: 2200,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: false,
  },
];

export const mockUser = {
  id: 'current-user',
  username: 'kartiksharma',
  displayName: 'Kartik Sharma',
  avatar: 'https://via.placeholder.com/150',
  verified: false,
  bio: 'AI Engineer | Linux Architect | Python Dev',
  followersCount: 1000,
  followingCount: 500,
};

export interface TrendingTopic {
  id: string;
  topic: string;
  description: string;
  tweetCount: number;
  category?: string;
}

export const mockTrendingTopics: TrendingTopic[] = [
  {
    id: 'trend-1',
    topic: '#AIRevolution',
    description: 'Discussions about the latest breakthroughs in artificial intelligence and machine learning.',
    tweetCount: 245000,
    category: 'Technology',
  },
  {
    id: 'trend-2',
    topic: '#ClimateAction',
    description: 'Global leaders gather for climate summit to discuss urgent environmental policies.',
    tweetCount: 189000,
    category: 'World',
  },
  {
    id: 'trend-3',
    topic: '#SpaceX',
    description: 'Starship successful orbital test flight marks new era in space exploration.',
    tweetCount: 312000,
    category: 'Science',
  },
  {
    id: 'trend-4',
    topic: '#CryptoRegulation',
    description: 'New regulatory frameworks proposed for digital assets across major economies.',
    tweetCount: 156000,
    category: 'Business',
  },
  {
    id: 'trend-5',
    topic: '#QuantumComputing',
    description: 'Researchers achieve quantum supremacy milestone with new processor architecture.',
    tweetCount: 98000,
    category: 'Technology',
  },
  {
    id: 'trend-6',
    topic: '#GreenEnergy',
    description: 'Solar and wind power installations reach record highs globally in 2024.',
    tweetCount: 134000,
    category: 'Environment',
  },
  {
    id: 'trend-7',
    topic: '#Neuralink',
    description: 'First human trial of brain-computer interface shows promising results.',
    tweetCount: 267000,
    category: 'Health',
  },
  {
    id: 'trend-8',
    topic: '#Web3',
    description: 'Decentralized applications gain mainstream adoption with improved user experience.',
    tweetCount: 112000,
    category: 'Technology',
  },
  {
    id: 'trend-9',
    topic: '#ElectricVehicles',
    description: 'Major automakers announce all-electric lineups by 2030.',
    tweetCount: 178000,
    category: 'Automotive',
  },
  {
    id: 'trend-10',
    topic: '#MarsMission',
    description: 'NASA and private companies outline timeline for human Mars landing.',
    tweetCount: 145000,
    category: 'Science',
  },
];

export interface CategoryTopic {
  id: string;
  name: string;
  description: string;
  tweetCount: number;
}

export const mockCategories: Record<string, CategoryTopic[]> = {
  news: [
    { id: 'news-1', name: 'Breaking: Global Summit', description: 'World leaders address economic cooperation and security.', tweetCount: 45000 },
    { id: 'news-2', name: 'Election Updates', description: 'Latest polls and campaign developments across key states.', tweetCount: 123000 },
    { id: 'news-3', name: 'Economic Report', description: 'Quarterly GDP figures exceed analyst expectations.', tweetCount: 34000 },
    { id: 'news-4', name: 'Diplomatic Talks', description: 'Negotiations resume on international trade agreements.', tweetCount: 28000 },
  ],
  sports: [
    { id: 'sports-1', name: 'Championship Finals', description: 'Game 7 decides the ultimate winner in thrilling fashion.', tweetCount: 567000 },
    { id: 'sports-2', name: 'Transfer Window', description: 'Major signings shake up league dynamics ahead of new season.', tweetCount: 234000 },
    { id: 'sports-3', name: 'Olympic Qualifiers', description: 'Athletes compete for spots at the upcoming games.', tweetCount: 89000 },
    { id: 'sports-4', name: 'Tennis Grand Slam', description: 'Top seeds advance as upsets shape the tournament.', tweetCount: 156000 },
  ],
  entertainment: [
    { id: 'ent-1', name: 'Movie Premiere', description: 'Highly anticipated blockbuster breaks opening weekend records.', tweetCount: 345000 },
    { id: 'ent-2', name: 'Album Release', description: 'Chart-topping artist drops surprise album to critical acclaim.', tweetCount: 278000 },
    { id: 'ent-3', name: 'Award Season', description: 'Nominations announced for prestigious entertainment awards.', tweetCount: 189000 },
    { id: 'ent-4', name: 'Streaming Series', description: 'New season of hit show sparks viral discussions.', tweetCount: 234000 },
  ],
};

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followersCount: number;
}

export const mockRecommendedUsers: User[] = [
  {
    id: 'rec-1',
    username: 'andrewng',
    displayName: 'Andrew Ng',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Co-founder of Coursera, Founder of DeepLearning.AI. Building AI education.',
    followersCount: 2100000,
  },
  {
    id: 'rec-2',
    username: 'karpathy',
    displayName: 'Andrej Karpathy',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Former Director of AI at Tesla. Building Eureka Labs. AI education.',
    followersCount: 1800000,
  },
  {
    id: 'rec-3',
    username: 'ylecun',
    displayName: 'Yann LeCun',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Chief AI Scientist at Meta. Professor at NYU. Turing Award winner.',
    followersCount: 950000,
  },
  {
    id: 'rec-4',
    username: 'demishassabis',
    displayName: 'Demis Hassabis',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Co-founder & CEO of Google DeepMind. Neuroscientist. AI researcher.',
    followersCount: 780000,
  },
  {
    id: 'rec-5',
    username: 'feifeili',
    displayName: 'Fei-Fei Li',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Professor at Stanford. Co-director of HAI. Former Chief Scientist at Google Cloud.',
    followersCount: 540000,
  },
];

export interface FollowSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followersCount: number;
  followingCount: number;
  mutualFollowers?: string[];
  reason?: string;
}

export const mockFollowSuggestions: FollowSuggestion[] = [
  {
    id: 'follow-1',
    username: 'sama',
    displayName: 'Sam Altman',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'CEO of OpenAI. Former president of Y Combinator.',
    followersCount: 3200000,
    followingCount: 100,
    mutualFollowers: ['andrewng', 'karpathy'],
    reason: 'Followed by Andrew Ng and Andrej Karpathy',
  },
  {
    id: 'follow-2',
    username: 'greg_brockman',
    displayName: 'Greg Brockman',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Co-founder & President of OpenAI.',
    followersCount: 890000,
    followingCount: 200,
    mutualFollowers: ['karpathy'],
    reason: 'Followed by Andrej Karpathy',
  },
  {
    id: 'follow-3',
    username: 'ilyasut',
    displayName: 'Ilya Sutskever',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Co-founder & Chief Scientist at OpenAI.',
    followersCount: 1100000,
    followingCount: 50,
    mutualFollowers: ['ylecun', 'demishassabis'],
    reason: 'Followed by Yann LeCun and Demis Hassabis',
  },
  {
    id: 'follow-4',
    username: 'francoischollet',
    displayName: 'François Chollet',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Creator of Keras. AI researcher at Google.',
    followersCount: 680000,
    followingCount: 300,
    mutualFollowers: ['feifeili'],
    reason: 'Followed by Fei-Fei Li',
  },
  {
    id: 'follow-5',
    username: 'goodfellow_ian',
    displayName: 'Ian Goodfellow',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Inventor of GANs. Research scientist at DeepMind.',
    followersCount: 450000,
    followingCount: 150,
    mutualFollowers: ['demishassabis', 'ylecun'],
    reason: 'Followed by Demis Hassabis and Yann LeCun',
  },
  {
    id: 'follow-6',
    username: 'ylecun',
    displayName: 'Yann LeCun',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Chief AI Scientist at Meta. Professor at NYU. Turing Award winner.',
    followersCount: 950000,
    followingCount: 400,
    mutualFollowers: ['demishassabis', 'andrewng'],
    reason: 'Followed by Demis Hassabis and Andrew Ng',
  },
  {
    id: 'follow-7',
    username: 'rao2z',
    displayName: 'Rao2z',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: false,
    bio: 'ML Engineer. Building open-source AI tools.',
    followersCount: 45000,
    followingCount: 800,
    reason: 'Popular in your network',
  },
  {
    id: 'follow-8',
    username: 'chipro',
    displayName: 'Chip Huyen',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'Author of "Designing Machine Learning Systems". Co-founder of Claypot AI.',
    followersCount: 120000,
    followingCount: 400,
    mutualFollowers: ['andrewng'],
    reason: 'Followed by Andrew Ng',
  },
  {
    id: 'follow-9',
    username: 'svpino',
    displayName: 'Santiago Valdarrama',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: false,
    bio: 'Teaching ML at https://mlschool.ai. Writing about AI.',
    followersCount: 85000,
    followingCount: 200,
    reason: 'Popular in your network',
  },
  {
    id: 'follow-10',
    username: 'omarsar0',
    displayName: 'Omar Sanseviero',
    avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
    verified: true,
    bio: 'ML Engineer at Hugging Face. Building open-source AI.',
    followersCount: 78000,
    followingCount: 300,
    mutualFollowers: ['lewtun'],
    reason: 'Followed by Lewis Tunstall',
  },
];

export interface Notification {
  id: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention' | 'quote';
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  tweet?: {
    id: string;
    content: string;
    author: {
      username: string;
      displayName: string;
    };
  };
  createdAt: string;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'like',
    actor: {
      id: '1',
      username: 'elonmusk',
      displayName: 'Elon Musk',
      avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yGsN4J5Q_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '1',
      content: 'Twitter is now X. The everything app is coming.',
      author: { username: 'kartiksharma', displayName: 'Kartik Sharma' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'retweet',
    actor: {
      id: '2',
      username: 'sundarpichai',
      displayName: 'Sundar Pichai',
      avatar: 'https://pbs.twimg.com/profile_images/1572692188940939265/6lQhJW3P_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '2',
      content: 'Excited to share our latest AI advances at Google I/O.',
      author: { username: 'kartiksharma', displayName: 'Kartik Sharma' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    type: 'reply',
    actor: {
      id: '3',
      username: 'satyanadella',
      displayName: 'Satya Nadella',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '3',
      content: '@kartiksharma Thanks for sharing! Microsoft is committed to responsible AI.',
      author: { username: 'satyanadella', displayName: 'Satya Nadella' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: 'notif-4',
    type: 'follow',
    actor: {
      id: '4',
      username: 'tim_cook',
      displayName: 'Tim Cook',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'notif-5',
    type: 'mention',
    actor: {
      id: '5',
      username: 'jeffbezos',
      displayName: 'Jeff Bezos',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '4',
      content: '@kartiksharma @elonmusk Great discussion on the future of space!',
      author: { username: 'jeffbezos', displayName: 'Jeff Bezos' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: true,
  },
  {
    id: 'notif-6',
    type: 'quote',
    actor: {
      id: '6',
      username: 'billgates',
      displayName: 'Bill Gates',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '5',
      content: 'Just finished reading "The Coming Wave" by Mustafa Suleyman. A must-read for anyone thinking about AI and the future.',
      author: { username: 'kartiksharma', displayName: 'Kartik Sharma' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: 'notif-7',
    type: 'like',
    actor: {
      id: '7',
      username: 'jack',
      displayName: 'Jack Dorsey',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    tweet: {
      id: '6',
      content: 'Building on Bitcoin. The open protocol for the internet of value.',
      author: { username: 'kartiksharma', displayName: 'Kartik Sharma' },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    read: true,
  },
  {
    id: 'notif-8',
    type: 'follow',
    actor: {
      id: '8',
      username: 'vitalikbuterin',
      displayName: 'Vitalik Buterin',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

export interface Conversation {
  id: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  }[];
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      {
        id: '1',
        username: 'elonmusk',
        displayName: 'Elon Musk',
        avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yGsN4J5Q_400x400.jpg',
        verified: true,
      },
    ],
    lastMessage: {
      content: 'Working on something exciting. Stay tuned! 🚀',
      senderId: '1',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    participants: [
      {
        id: '2',
        username: 'sundarpichai',
        displayName: 'Sundar Pichai',
        avatar: 'https://pbs.twimg.com/profile_images/1572692188940939265/6lQhJW3P_400x400.jpg',
        verified: true,
      },
    ],
    lastMessage: {
      content: 'Great meeting today. Let\'s follow up next week.',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    participants: [
      {
        id: '3',
        username: 'satyanadella',
        displayName: 'Satya Nadella',
        avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
        verified: true,
      },
    ],
    lastMessage: {
      content: 'Azure AI updates coming soon. Very excited about this.',
      senderId: '3',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    unreadCount: 1,
  },
  {
    id: 'conv-4',
    participants: [
      {
        id: '4',
        username: 'tim_cook',
        displayName: 'Tim Cook',
        avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
        verified: true,
      },
    ],
    lastMessage: {
      content: 'Privacy is a fundamental human right.',
      senderId: '4',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    unreadCount: 0,
  },
  {
    id: 'conv-5',
    participants: [
      {
        id: '5',
        username: 'jeffbezos',
        displayName: 'Jeff Bezos',
        avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
        verified: true,
      },
      {
        id: '6',
        username: 'elonmusk',
        displayName: 'Elon Musk',
        avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yGsN4J5Q_400x400.jpg',
        verified: true,
      },
    ],
    lastMessage: {
      content: 'Blue Origin progress update next week.',
      senderId: '5',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    },
    unreadCount: 0,
  },
];

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'msg-1', conversationId: 'conv-1', senderId: '1', content: 'Hey! Thanks for reaching out.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: true },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'current-user', content: 'Congrats on the Starship launch!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5).toISOString(), read: true },
    { id: 'msg-3', conversationId: 'conv-1', senderId: '1', content: 'Thanks! It was an incredible team effort.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 10).toISOString(), read: true },
    { id: 'msg-4', conversationId: 'conv-1', senderId: '1', content: 'Working on something exciting. Stay tuned! 🚀', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false },
  ],
  'conv-2': [
    { id: 'msg-5', conversationId: 'conv-2', senderId: '2', content: 'Great meeting today. Let\'s follow up next week.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: true },
    { id: 'msg-6', conversationId: 'conv-2', senderId: 'current-user', content: 'Absolutely! Looking forward to it.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60 * 2).toISOString(), read: true },
  ],
  'conv-3': [
    { id: 'msg-7', conversationId: 'conv-3', senderId: '3', content: 'Azure AI updates coming soon. Very excited about this.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: false },
  ],
  'conv-4': [
    { id: 'msg-8', conversationId: 'conv-4', senderId: '4', content: 'Privacy is a fundamental human right.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), read: true },
    { id: 'msg-9', conversationId: 'conv-4', senderId: 'current-user', content: 'Couldn\'t agree more.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1000 * 60 * 30).toISOString(), read: true },
  ],
  'conv-5': [
    { id: 'msg-10', conversationId: 'conv-5', senderId: '5', content: 'Blue Origin progress update next week.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), read: true },
    { id: 'msg-11', conversationId: 'conv-5', senderId: '6', content: 'Exciting! Space race is heating up.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72 + 1000 * 60 * 15).toISOString(), read: true },
  ],
};

export interface ProfileUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  verified: boolean;
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  mediaCount: number;
  likesCount: number;
}

export const mockProfileUser: ProfileUser = {
  id: 'current-user',
  username: 'rankmandi',
  displayName: 'Kartik Sharma',
  avatar: 'https://via.placeholder.com/400x400',
  banner: 'https://via.placeholder.com/1500x500',
  verified: false,
  bio: 'AI Engineer | Linux Architect | Python Dev\nBuilding the future, one commit at a time 🚀',
  location: 'San Francisco, CA',
  website: 'https://github.com/rankmandi',
  joinDate: 'January 2020',
  followersCount: 1234,
  followingCount: 567,
  tweetsCount: 2890,
  mediaCount: 156,
  likesCount: 4521,
};

export interface ProfileTweet extends Tweet {
  isReply?: boolean;
  replyTo?: {
    username: string;
    displayName: string;
  };
}

export const mockProfileTweets: ProfileTweet[] = [
  {
    id: 'profile-1',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Just deployed a new feature to production! The CI/CD pipeline is working beautifully. 🎉 #DevOps #CI/CD',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likesCount: 42,
    retweetsCount: 5,
    repliesCount: 3,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: 'profile-2',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Working on a new React + TypeScript project with Vite. The developer experience is incredible. Hot module replacement, TypeScript support out of the box, and blazing fast builds. Highly recommend!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likesCount: 128,
    retweetsCount: 12,
    repliesCount: 8,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: true,
  },
  {
    id: 'profile-3',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Linux tip of the day: Use `htop` instead of `top` for a better process monitoring experience. It has colors, mouse support, and a much cleaner interface. #Linux #SysAdmin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likesCount: 89,
    retweetsCount: 15,
    repliesCount: 4,
    isLiked: false,
    isRetweeted: true,
    isBookmarked: false,
  },
  {
    id: 'profile-4',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Python 3.12 performance improvements are no joke. Seeing 10-15% speedups on my ML workloads just by upgrading. The `faster-cpython` initiative is paying off! 🐍⚡',
    images: ['https://via.placeholder.com/800x450'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likesCount: 256,
    retweetsCount: 34,
    repliesCount: 12,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: true,
  },
  {
    id: 'profile-5',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Replying to @sundarpichai\n\nGreat insights on AI safety! The responsible AI principles you outlined are exactly what the industry needs. Looking forward to seeing how Google implements these in practice.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likesCount: 15,
    retweetsCount: 2,
    repliesCount: 1,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
    isReply: true,
    replyTo: {
      username: 'sundarpichai',
      displayName: 'Sundar Pichai',
    },
  },
  {
    id: 'profile-6',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Just finished reading "Designing Data-Intensive Applications" by Martin Kleppmann. This should be required reading for every backend engineer. The chapter on distributed systems alone is worth the price.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    likesCount: 67,
    retweetsCount: 8,
    repliesCount: 5,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: true,
  },
  {
    id: 'profile-7',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Weekend project: Building a custom mechanical keyboard. Soldering switches, flashing QMK firmware, the whole nine yards. There\'s something deeply satisfying about typing on something you built yourself. ⌨️',
    images: [
      'https://via.placeholder.com/600x600',
      'https://via.placeholder.com/600x600',
      'https://via.placeholder.com/600x600',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    likesCount: 134,
    retweetsCount: 18,
    repliesCount: 9,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: 'profile-8',
    author: {
      id: 'current-user',
      username: 'rankmandi',
      displayName: 'Kartik Sharma',
      avatar: 'https://via.placeholder.com/400x400',
      verified: false,
      followersCount: 1234,
      followingCount: 567,
    },
    content: 'Docker tip: Use multi-stage builds to keep your production images small. Here\'s a template I use for Node.js apps:\n\n```dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nCMD ["node", "dist/index.js"]\n```',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    likesCount: 312,
    retweetsCount: 45,
    repliesCount: 23,
    isLiked: false,
    isRetweeted: true,
    isBookmarked: true,
  },
];

export const mockProfileMedia = [
  'https://via.placeholder.com/600x600',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x600',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x600',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x600',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x450',
  'https://via.placeholder.com/600x600',
];

export const mockProfileLikes = [
  {
    id: 'like-1',
    author: {
      id: '1',
      username: 'elonmusk',
      displayName: 'Elon Musk',
      avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yGsN4J5Q_400x400.jpg',
      verified: true,
    },
    content: 'Twitter is now X. The everything app is coming.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likesCount: 45000,
    retweetsCount: 12000,
    repliesCount: 8500,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: 'like-2',
    author: {
      id: '2',
      username: 'sundarpichai',
      displayName: 'Sundar Pichai',
      avatar: 'https://pbs.twimg.com/profile_images/1572692188940939265/6lQhJW3P_400x400.jpg',
      verified: true,
    },
    content: 'Excited to share our latest AI advances at Google I/O. The future of search is here with generative AI.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likesCount: 25000,
    retweetsCount: 8000,
    repliesCount: 3200,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
  {
    id: 'like-3',
    author: {
      id: '3',
      username: 'satyanadella',
      displayName: 'Satya Nadella',
      avatar: 'https://pbs.twimg.com/profile_images/1480735024538869761/9EJ8J3QG_400x400.jpg',
      verified: true,
    },
    content: 'AI is the defining technology of our time. At Microsoft, we are committed to building AI responsibly and making it accessible to everyone.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likesCount: 18000,
    retweetsCount: 5500,
    repliesCount: 2100,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  },
];