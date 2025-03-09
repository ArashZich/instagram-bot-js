const mongoose = require("mongoose");

const TrendSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    trim: true,
  },
  hashtag: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      "عمومی",
      "ورزشی",
      "سیاسی",
      "فرهنگی",
      "هنری",
      "تکنولوژی",
      "سلامت",
      "سرگرمی",
      "آشپزی",
      "مد",
      "شخصی",
    ],
    default: "عمومی",
  },
  language: {
    type: String,
    enum: ["fa", "en", "mixed"],
    default: "fa",
  },
  postCount: {
    type: Number,
    default: 0,
  },
  engagementScore: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  relatedHashtags: [
    {
      type: String,
    },
  ],
  samplePosts: [
    {
      postId: String,
      postUrl: String,
      engagementRate: Number,
      likesCount: Number,
      commentsCount: Number,
    },
  ],
  description: {
    type: String,
    default: "",
  },
  lastFetchDate: {
    type: Date,
    default: Date.now,
  },
  discoveredAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Default trendy hashtags in Persian
TrendSchema.statics.defaultTrends = [
  {
    keyword: "طبیعت گردی",
    hashtag: "طبیعت_ایران",
    category: "عمومی",
    language: "fa",
    description: "مکان‌های زیبای طبیعی ایران، طبیعت‌گردی و گردشگری",
    relatedHashtags: ["ایران_زیبا", "طبیعت_گردی", "کوهنوردی", "جنگل", "دریا"],
  },
  {
    keyword: "آشپزی ایرانی",
    hashtag: "آشپزی_ایرانی",
    category: "آشپزی",
    language: "fa",
    description: "دستور پخت غذاهای سنتی و مدرن ایرانی",
    relatedHashtags: [
      "دستپخت",
      "آشپزباشی",
      "غذای_خانگی",
      "آشپزخانه",
      "فودبلاگر",
    ],
  },
  {
    keyword: "موسیقی سنتی",
    hashtag: "موسیقی_سنتی",
    category: "هنری",
    language: "fa",
    description: "موسیقی اصیل ایرانی و هنرمندان سنتی",
    relatedHashtags: ["موسیقی_ایرانی", "سنتور", "تار", "دف", "خوانندگی"],
  },
  {
    keyword: "کافه گردی",
    hashtag: "کافه_گردی",
    category: "سرگرمی",
    language: "fa",
    description: "معرفی کافه‌های جدید و محبوب",
    relatedHashtags: ["کافه", "قهوه", "کافه_تهران", "لاته_آرت", "کافه_گرام"],
  },
  {
    keyword: "عکاسی موبایل",
    hashtag: "عکاسی_موبایل",
    category: "هنری",
    language: "fa",
    description: "عکاسی با موبایل و ترفندهای عکاسی",
    relatedHashtags: [
      "موبایلوگرافی",
      "عکاسی",
      "فوتوگرافی",
      "عکس_روز",
      "هنر_عکاسی",
    ],
  },
  {
    keyword: "ورزش خانگی",
    hashtag: "ورزش_در_خانه",
    category: "سلامت",
    language: "fa",
    description: "تمرینات ورزشی که می‌توان در خانه انجام داد",
    relatedHashtags: ["فیتنس", "تناسب_اندام", "سلامتی", "یوگا", "بدنسازی"],
  },
  {
    keyword: "کتابخوانی",
    hashtag: "کتاب_خوب",
    category: "فرهنگی",
    language: "fa",
    description: "معرفی کتاب‌های جدید و پرفروش",
    relatedHashtags: [
      "کتابخوان",
      "کتابخانه",
      "رمان",
      "کتاب_بخوانیم",
      "کتابباز",
    ],
  },
  {
    keyword: "گیاهان آپارتمانی",
    hashtag: "گیاهان_آپارتمانی",
    category: "عمومی",
    language: "fa",
    description: "نگهداری و پرورش گیاهان خانگی",
    relatedHashtags: ["گل_و_گیاه", "گیاه_من", "باغبانی", "کاکتوس", "ساکولنت"],
  },
  {
    keyword: "مد و لباس",
    hashtag: "استایل",
    category: "مد",
    language: "fa",
    description: "ترندهای جدید مد و پوشاک ایرانی",
    relatedHashtags: ["مد_روز", "فشن", "استایل_ایرانی", "لباس", "طراحی_لباس"],
  },
  {
    keyword: "بازی موبایل",
    hashtag: "بازی_موبایل",
    category: "تکنولوژی",
    language: "fa",
    description: "معرفی و نقد بازی‌های موبایلی محبوب",
    relatedHashtags: [
      "گیمینگ",
      "گیمر",
      "بازی_آنلاین",
      "موبایل_گیم",
      "بازی_ایرانی",
    ],
  },
  {
    keyword: "دیجیتال مارکتینگ",
    hashtag: "دیجیتال_مارکتینگ",
    category: "تکنولوژی",
    language: "fa",
    description: "بازاریابی آنلاین و استراتژی‌های دیجیتال",
    relatedHashtags: [
      "سئو",
      "بازاریابی_محتوا",
      "شبکه_اجتماعی",
      "کسب_و_کار_آنلاین",
      "استارتاپ",
    ],
  },
  {
    keyword: "گردشگری داخلی",
    hashtag: "ایرانگردی",
    category: "عمومی",
    language: "fa",
    description: "سفر به نقاط مختلف ایران و معرفی جاذبه‌های گردشگری",
    relatedHashtags: [
      "سفر",
      "گردشگری",
      "ایران_زیبا",
      "توریسم",
      "جاذبه_گردشگری",
    ],
  },
];

// Find active trends
TrendSchema.statics.getActiveTrends = async function (
  limit = 5,
  category = null
) {
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  return this.find(query).sort({ engagementScore: -1 }).limit(limit);
};

// Update trend stats
TrendSchema.methods.updateStats = function (postCount, engagementScore) {
  this.postCount = postCount;
  this.engagementScore = engagementScore;
  this.lastFetchDate = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Add sample post to trend
TrendSchema.methods.addSamplePost = function (post) {
  // Keep only the top 5 most engaging posts
  this.samplePosts.push(post);
  this.samplePosts.sort((a, b) => b.engagementRate - a.engagementRate);
  this.samplePosts = this.samplePosts.slice(0, 5);
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Trend", TrendSchema);
