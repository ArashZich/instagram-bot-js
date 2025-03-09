/**
 * تعاریف شماهای Swagger برای استفاده مجدد
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountStats:
 *       type: object
 *       properties:
 *         daily:
 *           type: object
 *           properties:
 *             likes:
 *               type: integer
 *               description: تعداد لایک‌های امروز
 *             comments:
 *               type: integer
 *               description: تعداد کامنت‌های امروز
 *             directMessages:
 *               type: integer
 *               description: تعداد پیام‌های مستقیم امروز
 *             follows:
 *               type: integer
 *               description: تعداد فالوهای امروز
 *             unfollows:
 *               type: integer
 *               description: تعداد آنفالوهای امروز
 *             storyViews:
 *               type: integer
 *               description: تعداد مشاهدات استوری امروز
 *             total:
 *               type: integer
 *               description: کل تعاملات امروز
 *         weekly:
 *           type: object
 *           properties:
 *             interactions:
 *               type: integer
 *               description: کل تعاملات هفته اخیر
 *         monthly:
 *           type: object
 *           properties:
 *             interactions:
 *               type: integer
 *               description: کل تعاملات ماه اخیر
 *         follows:
 *           type: object
 *           properties:
 *             active:
 *               type: integer
 *               description: تعداد فالوهای فعال
 *             followBacks:
 *               type: integer
 *               description: تعداد فالوبک‌ها
 *             followBackRate:
 *               type: number
 *               description: نرخ فالوبک (درصد)
 *
 *     BotSettings:
 *       type: object
 *       properties:
 *         botMode:
 *           type: string
 *           enum: [active, passive, maintenance, stealth]
 *           description: حالت فعلی بات
 *         enabledFeatures:
 *           type: object
 *           properties:
 *             like:
 *               type: boolean
 *               description: فعال بودن قابلیت لایک
 *             comment:
 *               type: boolean
 *               description: فعال بودن قابلیت کامنت
 *             follow:
 *               type: boolean
 *               description: فعال بودن قابلیت فالو
 *             unfollow:
 *               type: boolean
 *               description: فعال بودن قابلیت آنفالو
 *             directMessage:
 *               type: boolean
 *               description: فعال بودن قابلیت پیام مستقیم
 *             viewStory:
 *               type: boolean
 *               description: فعال بودن قابلیت مشاهده استوری
 *         limits:
 *           type: object
 *           properties:
 *             dailyLikes:
 *               type: integer
 *               description: حداکثر تعداد لایک روزانه
 *             dailyComments:
 *               type: integer
 *               description: حداکثر تعداد کامنت روزانه
 *             dailyFollows:
 *               type: integer
 *               description: حداکثر تعداد فالو روزانه
 *             dailyUnfollows:
 *               type: integer
 *               description: حداکثر تعداد آنفالو روزانه
 *             dailyDirectMessages:
 *               type: integer
 *               description: حداکثر تعداد پیام مستقیم روزانه
 *             dailyStoryViews:
 *               type: integer
 *               description: حداکثر تعداد مشاهده استوری روزانه
 *         schedule:
 *           type: object
 *           properties:
 *             startHour:
 *               type: integer
 *               description: ساعت شروع فعالیت
 *             endHour:
 *               type: integer
 *               description: ساعت پایان فعالیت
 *             activeOnWeekends:
 *               type: boolean
 *               description: فعال بودن در آخر هفته
 *
 *     Trend:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: شناسه ترند
 *         keyword:
 *           type: string
 *           description: کلمه کلیدی ترند
 *         hashtag:
 *           type: string
 *           description: هشتگ مرتبط
 *         category:
 *           type: string
 *           description: دسته‌بندی
 *         postCount:
 *           type: integer
 *           description: تعداد پست‌ها
 *         engagementScore:
 *           type: number
 *           description: امتیاز تعامل
 *         lastFetchDate:
 *           type: string
 *           format: date-time
 *           description: تاریخ آخرین به‌روزرسانی
 *         relatedHashtags:
 *           type: array
 *           items:
 *             type: string
 *           description: هشتگ‌های مرتبط
 *
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: شناسه کاربر در اینستاگرام
 *         username:
 *           type: string
 *           description: نام کاربری
 *         fullName:
 *           type: string
 *           description: نام کامل
 *         isPrivate:
 *           type: boolean
 *           description: خصوصی بودن اکانت
 *         engagement:
 *           type: number
 *           description: میزان تعامل
 *         isFollowing:
 *           type: boolean
 *           description: آیا فالو شده است
 *         didFollowBack:
 *           type: boolean
 *           description: آیا فالوبک داده است
 */
