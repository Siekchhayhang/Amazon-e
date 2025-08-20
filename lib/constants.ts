export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CollectionsOnlineShop';
export const APP_SLOGAN =
    process.env.NEXT_PUBLIC_APP_SLOGAN || 'Spend less, enjoy more.'
export const APP_DESCRIPTION =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Collections Online Shop is your easy, one-stop solution for all your shopping needs. We bring together a wide range of popular and hard-to-find items, making it simple to browse, compare, and buy from the comfort of your home. Our goal is to make online shopping a seamless and enjoyable experience, offering diverse products that cater to your lifestyle. Start exploring our extensive collections today and simplify your shopping!'
export const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
export const MONGODB_URI = process.env.MONGODB_URI


export const SENDER_NAME = process.env.SENDER_NAME || 'support'
export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'
export const RESEND_API_KEY = process.env.RESEND_API_KEY

export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export const WEBSITE_LOGO = '/logo.png'

export const NODE_ENV = process.env.NODE_ENV === 'production'

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export const CART_JWT_SECRET = process.env.CART_JWT_SECRET

export const ABA_PAYWAY_MERCHANT_ID = process.env.ABA_PAYWAY_MERCHANT_ID
export const ABA_PAYWAY_API_KEY = process.env.ABA_PAYWAY_API_KEY
export const ABA_PAYWAY_MERCHANT_NAME = process.env.ABA_PAYWAY_MERCHANT_NAME
export const ABA_PAYWAY_BASE_URL = process.env.ABA_PAYWAY_BASE_URL



export const USER_ROLES = ['Admin', 'User', 'Sale', 'Stocker'];
export const COLORS = ['Gold', 'Green', 'Red']
export const THEMES = ['Light', 'Dark', 'System']
