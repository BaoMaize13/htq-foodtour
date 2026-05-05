require('dotenv').config();

const connectDB = require('../config/db');

const Role = require('../modules/users/models/role.model');
const User = require('../modules/users/models/user.model');
const UserFavorite = require('../modules/users/models/user-favorite.model');
const OwnerProfile = require('../modules/users/models/owner-profile.model');

const Category = require('../modules/places/models/category.model');
const POI = require('../modules/places/models/poi.model');

const MenuItem = require('../modules/menu/models/menu-item.model');
const Review = require('../modules/reviews/models/review.model');

const Narration = require('../modules/narrations/models/narration.model');
const AudioAsset = require('../modules/narrations/models/audio-asset.model');

const { hashPassword } = require('../utils/password.util');

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@smartfoodtour.local';
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'admin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'ad123';

const fs = require('fs');
const path = require('path');

const ROLE_SEEDS = [
    {
        code: 'ADMIN',
        name: 'Administrator',
        description: 'System administrator role',
    },
    {
        code: 'OWNER',
        name: 'Owner',
        description: 'Restaurant owner role',
    },
    {
        code: 'USER',
        name: 'User',
        description: 'End user role',
    },
];

const CATEGORY_SEEDS = [
    {
        name: 'Món Hoa',
        slug: 'mon-hoa',
        description: 'Các món ăn và nhà hàng phong cách Hoa',
    },
    {
        name: 'Mì - Hủ tiếu',
        slug: 'mi-hu-tieu',
        description: 'Các món mì, hủ tiếu, hoành thánh, vằn thắn',
    },
    {
        name: 'Lẩu',
        slug: 'lau',
        description: 'Các địa điểm lẩu Hoa, lẩu cay và lẩu hải sản',
    },
    {
        name: 'Nước uống',
        slug: 'nuoc-uong',
        description: 'Trà, trà sữa, nước mát và đồ uống giải khát',
    },
    {
        name: 'Dimsum',
        slug: 'dimsum',
        description: 'Các quán dimsum và điểm tâm Hoa',
    },
];

const POI_ENGLISH_TRANSLATIONS = {
    'Sweet Hut - Chè Kiểu Hồng Kông': {
        name: 'Sweet Hut - Hong Kong Desserts',
        shortDescription: 'A dessert stop for Hong Kong-style sweet soups and drinks.',
        fullDescription:
            'Sweet Hut is a familiar dessert stop on Ha Ton Quyen Street, suitable for a sweet finish after enjoying dumplings and Chinese dishes.',
    },
    'Mì Kéo Kungfu Khải Ký - Điểm Tâm Hongkong': {
        name: 'Khai Ky Kungfu Hand-Pulled Noodles',
        shortDescription: 'Hand-pulled noodles and Hong Kong-style dimsum.',
        fullDescription:
            'Khai Ky serves hand-pulled noodles, dimsum, and classic Chinese comfort dishes on Ha Ton Quyen Street.',
    },
    'Trà Sữa MayCha - Hà Tôn Quyền': {
        name: 'MayCha Milk Tea - Ha Ton Quyen',
        shortDescription: 'Milk tea and takeaway drinks on the food street.',
        fullDescription:
            'MayCha is a convenient stop for milk tea, fruit tea, and takeaway drinks while exploring Ha Ton Quyen Street.',
    },
    'Sủi Cảo 132': {
        name: 'Dumplings 132',
        shortDescription: 'A small dumpling shop on Ha Ton Quyen Street.',
        fullDescription:
            'Dumplings 132 is a casual dumpling stop with Chinese-style comfort food suitable for a quick meal.',
    },
    'Sữa Chua Trân Châu Hạ Long': {
        name: 'Ha Long Yogurt with Pearls',
        shortDescription: 'A sweet yogurt dessert stop with toppings.',
        fullDescription:
            'This dessert shop serves yogurt with pearls and sweet snacks, making it a light stop during a Ha Ton Quyen food walk.',
    },
    'Cường Ký Mì Gia': {
        name: 'Cuong Ky Noodle House',
        shortDescription: 'Chinese-style noodle and dumpling dishes.',
        fullDescription:
            'Cuong Ky Noodle House is known for noodles, wontons, and flavorful broth, and is one of the familiar dining spots on Ha Ton Quyen Street.',
    },
    'Sủi Cảo 162': {
        name: 'Dumplings 162',
        shortDescription: 'A popular dumpling stop in the Ha Ton Quyen area.',
        fullDescription:
            'Dumplings 162 is a familiar stop for diners who enjoy soup dumplings, dry noodles, and casual Chinese dishes.',
    },
    'Tiệm Trà Happy & Hotdog - Hà Tôn Quyền': {
        name: 'Happy Tea & Hotdog',
        shortDescription: 'Tea drinks and quick bites for takeaway.',
        fullDescription:
            'Happy Tea & Hotdog offers tea drinks and light snacks, making it a convenient stop while walking along Ha Ton Quyen Street.',
    },
    'Sủi Cảo 175': {
        name: 'Dumplings 175',
        shortDescription: 'A busy dumpling shop on Ha Ton Quyen Street.',
        fullDescription:
            'Dumplings 175 is a well-known casual spot serving dumplings and Chinese-style comfort food on Ha Ton Quyen Street.',
    },
    'Cháo Lòng Bò': {
        name: 'Beef Offal Porridge',
        shortDescription: 'A well-known porridge spot in the area.',
        fullDescription:
            'This long-running porridge spot is known for beef offal porridge and is one of the memorable street-food stops near Ha Ton Quyen.',
    },
    'Sủi Cảo Ngọc Ý': {
        name: 'Ngoc Y Dumplings',
        shortDescription: 'A long-running dumpling shop on Ha Ton Quyen Street.',
        fullDescription:
            'Ngoc Y is one of the better-known dumpling shops in the Ha Ton Quyen area, suitable for a quick meal or a food tour stop.',
    },
    '193 Thuận Hảo Sủi Cảo': {
        name: 'Thuan Hao Dumplings 193',
        shortDescription: 'Dumplings and budget Chinese dishes.',
        fullDescription:
            'Thuan Hao is a casual stop in the Ha Ton Quyen area, known for dumplings and Chinese-style dishes at approachable prices.',
    },
    'Sủi Cảo Thiên Thiên': {
        name: 'Thien Thien Dumplings',
        shortDescription: 'A famous dumpling spot that gets crowded at night.',
        fullDescription:
            'Thien Thien is a well-known dumpling destination on Ha Ton Quyen Street, often busy in the evening and late at night.',
    },
    'Quán Ăn Sen Nguyên': {
        name: 'Sen Nguyen Eatery',
        shortDescription: 'A rice and Chinese-style comfort food stop.',
        fullDescription:
            'Sen Nguyen is a casual eatery serving rice dishes and comfort food, suitable for a quick meal in the Ha Ton Quyen area.',
    },
    'Cà Phê, Cam Vắt & Trà Tắc - Hà Tôn Quyền': {
        name: 'Coffee, Orange Juice & Kumquat Tea',
        shortDescription: 'Refreshing drinks on Ha Ton Quyen Street.',
        fullDescription:
            'This small drink stop serves coffee, fresh orange juice, and kumquat tea for visitors exploring the Ha Ton Quyen food street.',
    },
};

const CONTENT_LANGUAGE_LABELS = {
    ja: {
        dimsum: '点心',
        'mi-hu-tieu': '麺料理',
        lau: '火鍋',
        'nuoc-uong': 'ドリンク',
        'mon-hoa': '中華料理',
        short: (name, category) =>
            `${name}は、ハートンクエン通りで楽しめる${category}のおすすめスポットです。`,
        full: (name, category) =>
            `${name}は、ハートンクエン通りのフードツアーで訪れやすい${category}のお店です。落ち着いた雰囲気と親しみやすい味わいで、友人や家族との食事に向いています。`,
    },
    ko: {
        dimsum: '딤섬',
        'mi-hu-tieu': '면 요리',
        lau: '훠궈',
        'nuoc-uong': '음료',
        'mon-hoa': '중식',
        short: (name, category) =>
            `${name}은 하톤꾸옌 거리에서 즐길 수 있는 ${category} 추천 장소입니다.`,
        full: (name, category) =>
            `${name}은 하톤꾸옌 음식 거리에서 방문하기 좋은 ${category} 매장입니다. 편안한 분위기와 친근한 맛으로 친구나 가족과 함께 즐기기 좋습니다.`,
    },
    fr: {
        dimsum: 'dimsum',
        'mi-hu-tieu': 'nouilles',
        lau: 'fondue chinoise',
        'nuoc-uong': 'boissons',
        'mon-hoa': 'cuisine chinoise',
        short: (name, category) =>
            `${name} est une adresse recommandée pour ${category} dans la rue Ha Ton Quyen.`,
        full: (name, category) =>
            `${name} est un lieu agréable à découvrir lors d’un food tour dans la rue Ha Ton Quyen. Cette adresse propose ${category} dans une ambiance conviviale, adaptée aux amis comme aux familles.`,
    },
    es: {
        dimsum: 'dimsum',
        'mi-hu-tieu': 'fideos',
        lau: 'hotpot',
        'nuoc-uong': 'bebidas',
        'mon-hoa': 'comida china',
        short: (name, category) =>
            `${name} es un lugar recomendado para disfrutar de ${category} en la calle Ha Ton Quyen.`,
        full: (name, category) =>
            `${name} es una buena parada durante un recorrido gastronómico por la calle Ha Ton Quyen. Ofrece ${category} en un ambiente cómodo, ideal para amigos o familias.`,
    },
    de: {
        dimsum: 'Dimsum',
        'mi-hu-tieu': 'Nudeln',
        lau: 'Hotpot',
        'nuoc-uong': 'Getränke',
        'mon-hoa': 'chinesische Küche',
        short: (name, category) =>
            `${name} ist ein empfehlenswerter Ort für ${category} in der Ha-Ton-Quyen-Straße.`,
        full: (name, category) =>
            `${name} ist eine gute Station auf einer Food-Tour durch die Ha-Ton-Quyen-Straße. Der Ort bietet ${category} in einer angenehmen Atmosphäre und eignet sich für Freunde oder Familien.`,
    },
    ru: {
        dimsum: 'димсам',
        'mi-hu-tieu': 'лапшу',
        lau: 'хотпот',
        'nuoc-uong': 'напитки',
        'mon-hoa': 'китайскую кухню',
        short: (name, category) =>
            `${name} — рекомендуемое место, где можно попробовать ${category} на улице Ha Ton Quyen.`,
        full: (name, category) =>
            `${name} — хорошая остановка во время гастрономического тура по улице Ha Ton Quyen. Здесь можно попробовать ${category} в спокойной и дружелюбной атмосфере.`,
    },
    'zh-Hans': {
        dimsum: '点心',
        'mi-hu-tieu': '面食',
        lau: '火锅',
        'nuoc-uong': '饮品',
        'mon-hoa': '中餐',
        short: (name, category) =>
            `${name}是河吨权街值得体验的${category}地点。`,
        full: (name, category) =>
            `${name}适合在河吨权美食街游览时停留体验。这里提供${category}，氛围亲切，适合朋友或家庭用餐。`,
    },
    'zh-Hant': {
        dimsum: '點心',
        'mi-hu-tieu': '麵食',
        lau: '火鍋',
        'nuoc-uong': '飲品',
        'mon-hoa': '中餐',
        short: (name, category) =>
            `${name}是河噸權街值得體驗的${category}地點。`,
        full: (name, category) =>
            `${name}適合在河噸權美食街遊覽時停留體驗。這裡提供${category}，氛圍親切，適合朋友或家庭用餐。`,
    },
};

const MENU_NAME_TRANSLATIONS = {
    'Há cảo tôm': {
        en: 'Shrimp Dumplings',
        ja: '海老餃子',
        ko: '새우 하가우',
        fr: 'Raviolis aux crevettes',
        es: 'Dumplings de camarón',
        de: 'Garnelen-Dumplings',
        ru: 'Креветочные пельмени',
        'zh-Hans': '鲜虾饺',
        'zh-Hant': '鮮蝦餃',
    },
    'Xíu mại trứng cua': {
        en: 'Crab Roe Shumai',
        ja: '蟹の卵入りシュウマイ',
        ko: '게알 샤오마이',
        fr: 'Shumai aux œufs de crabe',
        es: 'Shumai con huevas de cangrejo',
        de: 'Shumai mit Krabbenrogen',
        ru: 'Шумай с крабовой икрой',
        'zh-Hans': '蟹黄烧卖',
        'zh-Hant': '蟹黃燒賣',
    },
    'Bánh bao kim sa': {
        en: 'Salted Egg Custard Bun',
        ja: '塩卵カスタードまん',
        ko: '흐르는 커스터드 번',
        fr: 'Bao à la crème d’œuf salé',
        es: 'Bollo relleno de crema de yema salada',
        de: 'Bao mit Salz-Ei-Creme',
        ru: 'Бао с кремом из солёного яйца',
        'zh-Hans': '流沙包',
        'zh-Hant': '流沙包',
    },
    'Chân gà tàu xì': {
        en: 'Chicken Feet with Black Bean Sauce',
        ja: '鶏足の黒豆ソース蒸し',
        ko: '두시 소스 닭발',
        fr: 'Pattes de poulet sauce haricots noirs',
        es: 'Patas de pollo con salsa de frijol negro',
        de: 'Hühnerfüße mit schwarzer Bohnensauce',
        ru: 'Куриные лапки в соусе из черных бобов',
        'zh-Hans': '豉汁凤爪',
        'zh-Hant': '豉汁鳳爪',
    },
    'Bánh cuốn tôm hấp': {
        en: 'Steamed Shrimp Rice Rolls',
        ja: '海老の蒸しライスロール',
        ko: '새우 창펀',
        fr: 'Rouleaux de riz vapeur aux crevettes',
        es: 'Rollos de arroz al vapor con camarón',
        de: 'Gedämpfte Reisrollen mit Garnelen',
        ru: 'Паровые рисовые роллы с креветками',
        'zh-Hans': '鲜虾肠粉',
        'zh-Hant': '鮮蝦腸粉',
    },
    'Mì vằn thắn đặc biệt': {
        en: 'Special Wonton Noodles',
        ja: '特製ワンタン麺',
        ko: '스페셜 완탕면',
        fr: 'Nouilles wonton spéciales',
        es: 'Fideos wonton especiales',
        de: 'Spezielle Wan-Tan-Nudeln',
        ru: 'Особая лапша с вонтонами',
        'zh-Hans': '招牌云吞面',
        'zh-Hant': '招牌雲吞麵',
    },
    'Mì hoành thánh xá xíu': {
        en: 'Wonton Noodles with Char Siu',
        ja: '叉焼ワンタン麺',
        ko: '차슈 완탕면',
        fr: 'Nouilles wonton au char siu',
        es: 'Fideos wonton con char siu',
        de: 'Wan-Tan-Nudeln mit Char Siu',
        ru: 'Лапша с вонтонами и чар сью',
        'zh-Hans': '叉烧云吞面',
        'zh-Hant': '叉燒雲吞麵',
    },
    'Hủ tiếu sa tế bò': {
        en: 'Beef Satay Noodles',
        ja: '牛肉サテー麺',
        ko: '소고기 사테 면',
        fr: 'Nouilles saté au bœuf',
        es: 'Fideos satay de res',
        de: 'Rindfleisch-Satay-Nudeln',
        ru: 'Лапша с говядиной сатай',
        'zh-Hans': '牛肉沙爹粉',
        'zh-Hant': '牛肉沙嗲粉',
    },
    'Mì khô sốt dầu hào': {
        en: 'Dry Noodles with Oyster Sauce',
        ja: 'オイスターソース和え麺',
        ko: '굴소스 비빔면',
        fr: 'Nouilles sèches sauce huître',
        es: 'Fideos secos con salsa de ostras',
        de: 'Trockene Nudeln mit Austernsauce',
        ru: 'Сухая лапша с устричным соусом',
        'zh-Hans': '蚝油拌面',
        'zh-Hant': '蠔油拌麵',
    },
    'Hủ tiếu xào giòn': {
        en: 'Crispy Fried Rice Noodles',
        ja: '揚げ焼きビーフン',
        ko: '바삭한 볶음 쌀국수',
        fr: 'Nouilles de riz sautées croustillantes',
        es: 'Fideos de arroz crujientes salteados',
        de: 'Knusprig gebratene Reisnudeln',
        ru: 'Хрустящая жареная рисовая лапша',
        'zh-Hans': '香脆炒河粉',
        'zh-Hant': '香脆炒河粉',
    },
    'Lẩu uyên ương': {
        en: 'Dual Broth Hotpot',
        ja: '二色鍋',
        ko: '원앙 훠궈',
        fr: 'Fondue à double bouillon',
        es: 'Hotpot de doble caldo',
        de: 'Zweierlei-Hotpot',
        ru: 'Хотпот с двумя бульонами',
        'zh-Hans': '鸳鸯火锅',
        'zh-Hant': '鴛鴦火鍋',
    },
    'Lẩu Tứ Xuyên cay': {
        en: 'Spicy Sichuan Hotpot',
        ja: '四川麻辣火鍋',
        ko: '매운 사천 훠궈',
        fr: 'Fondue sichuana épicée',
        es: 'Hotpot picante de Sichuan',
        de: 'Scharfer Sichuan-Hotpot',
        ru: 'Острый сычуаньский хотпот',
        'zh-Hans': '麻辣四川火锅',
        'zh-Hant': '麻辣四川火鍋',
    },
    'Lẩu hải sản': {
        en: 'Seafood Hotpot',
        ja: '海鮮火鍋',
        ko: '해산물 훠궈',
        fr: 'Fondue de fruits de mer',
        es: 'Hotpot de mariscos',
        de: 'Meeresfrüchte-Hotpot',
        ru: 'Хотпот с морепродуктами',
        'zh-Hans': '海鲜火锅',
        'zh-Hant': '海鮮火鍋',
    },
    'Bò viên Tứ Xuyên': {
        en: 'Sichuan Beef Balls',
        ja: '四川風牛肉団子',
        ko: '사천식 소고기 완자',
        fr: 'Boulettes de bœuf façon Sichuan',
        es: 'Albóndigas de res estilo Sichuan',
        de: 'Sichuan-Rindfleischbällchen',
        ru: 'Говяжьи фрикадельки по-сычуаньски',
        'zh-Hans': '四川牛肉丸',
        'zh-Hant': '四川牛肉丸',
    },
    'Combo rau nấm lẩu': {
        en: 'Hotpot Vegetables & Mushroom Combo',
        ja: '火鍋用野菜ときのこ盛り合わせ',
        ko: '훠궈용 채소·버섯 세트',
        fr: 'Assortiment légumes et champignons pour fondue',
        es: 'Combo de verduras y hongos para hotpot',
        de: 'Gemüse- und Pilz-Kombo für Hotpot',
        ru: 'Набор овощей и грибов для хотпота',
        'zh-Hans': '火锅蔬菜菌菇拼盘',
        'zh-Hant': '火鍋蔬菜菌菇拼盤',
    },
    'Trà ô long thượng hạng': {
        en: 'Premium Oolong Tea',
        ja: '上級烏龍茶',
        ko: '프리미엄 우롱차',
        fr: 'Thé oolong premium',
        es: 'Té oolong premium',
        de: 'Premium-Oolong-Tee',
        ru: 'Премиальный улун',
        'zh-Hans': '特级乌龙茶',
        'zh-Hant': '特級烏龍茶',
    },
    'Trà phổ nhĩ ủ lâu năm': {
        en: 'Aged Pu-erh Tea',
        ja: '熟成プーアル茶',
        ko: '숙성 보이차',
        fr: 'Thé pu-erh vieilli',
        es: 'Té pu-erh añejado',
        de: 'Gereifter Pu-Erh-Tee',
        ru: 'Выдержанный пуэр',
        'zh-Hans': '陈年普洱茶',
        'zh-Hant': '陳年普洱茶',
    },
    'Trà sữa trân châu': {
        en: 'Milk Tea with Pearls',
        ja: 'タピオカミルクティー',
        ko: '펄 밀크티',
        fr: 'Thé au lait avec perles',
        es: 'Té con leche y perlas',
        de: 'Milchtee mit Perlen',
        ru: 'Молочный чай с жемчужинами',
        'zh-Hans': '珍珠奶茶',
        'zh-Hant': '珍珠奶茶',
    },
    'Trà đào cam sả': {
        en: 'Peach Orange Lemongrass Tea',
        ja: '桃・オレンジ・レモングラスティー',
        ko: '복숭아 오렌지 레몬그라스 티',
        fr: 'Thé pêche orange citronnelle',
        es: 'Té de durazno, naranja y limoncillo',
        de: 'Pfirsich-Orangen-Zitronengras-Tee',
        ru: 'Чай с персиком, апельсином и лемонграссом',
        'zh-Hans': '桃香橙子香茅茶',
        'zh-Hant': '蜜桃橙香香茅茶',
    },
    'Nước mát thảo mộc': {
        en: 'Herbal Cooling Drink',
        ja: 'ハーブ清涼ドリンク',
        ko: '허브 청량 음료',
        fr: 'Boisson fraîche aux herbes',
        es: 'Bebida herbal refrescante',
        de: 'Kräuter-Erfrischungsgetränk',
        ru: 'Прохладительный травяной напиток',
        'zh-Hans': '草本清凉饮',
        'zh-Hant': '草本清涼飲',
    },
    'Cơm chiên Dương Châu': {
        en: 'Yangzhou Fried Rice',
        ja: '揚州チャーハン',
        ko: '양저우 볶음밥',
        fr: 'Riz frit de Yangzhou',
        es: 'Arroz frito Yangzhou',
        de: 'Yangzhou-Gebratenreis',
        ru: 'Жареный рис Янчжоу',
        'zh-Hans': '扬州炒饭',
        'zh-Hant': '揚州炒飯',
    },
    'Vịt quay Bắc Kinh': {
        en: 'Peking Roast Duck',
        ja: '北京ダック',
        ko: '북경오리구이',
        fr: 'Canard laqué de Pékin',
        es: 'Pato laqueado de Pekín',
        de: 'Peking-Ente',
        ru: 'Утка по-пекински',
        'zh-Hans': '北京烤鸭',
        'zh-Hant': '北京烤鴨',
    },
    'Gà hấp hành gừng': {
        en: 'Steamed Chicken with Ginger and Scallion',
        ja: '鶏の生姜ねぎ蒸し',
        ko: '생강 파를 곁들인 찜닭',
        fr: 'Poulet vapeur au gingembre et à la ciboule',
        es: 'Pollo al vapor con jengibre y cebollín',
        de: 'Gedämpftes Hähnchen mit Ingwer und Frühlingszwiebeln',
        ru: 'Паровая курица с имбирем и зеленым луком',
        'zh-Hans': '姜葱蒸鸡',
        'zh-Hant': '薑蔥蒸雞',
    },
    'Mì xào hải sản': {
        en: 'Seafood Fried Noodles',
        ja: '海鮮焼きそば',
        ko: '해산물 볶음면',
        fr: 'Nouilles sautées aux fruits de mer',
        es: 'Fideos salteados con mariscos',
        de: 'Gebratene Nudeln mit Meeresfrüchten',
        ru: 'Жареная лапша с морепродуктами',
        'zh-Hans': '海鲜炒面',
        'zh-Hant': '海鮮炒麵',
    },
    'Đậu hũ Tứ Xuyên': {
        en: 'Sichuan Tofu',
        ja: '四川風豆腐',
        ko: '사천식 두부',
        fr: 'Tofu façon Sichuan',
        es: 'Tofu estilo Sichuan',
        de: 'Tofu nach Sichuan-Art',
        ru: 'Тофу по-сычуаньски',
        'zh-Hans': '四川豆腐',
        'zh-Hant': '四川豆腐',
    },
};

const buildAddressTranslations = (address) => {
    const raw = String(address || '').trim();
    const number = raw.split('Hà Tôn Quyền')[0].replace(/,\s*$/g, '').trim();

    const numberText = number || '';

    return {
        en: `${numberText} Ha Ton Quyen Street, Minh Phung Ward, Ho Chi Minh City`,
        ja: `ホーチミン市ミンフン街区 ハートンクエン通り${numberText}`,
        ko: `호찌민시 민풍동 하톤꾸옌 ${numberText}`,
        fr: `${numberText} rue Ha Ton Quyen, quartier Minh Phung, Hô Chi Minh-Ville`,
        es: `${numberText} calle Ha Ton Quyen, barrio Minh Phung, Ciudad Ho Chi Minh`,
        de: `${numberText} Ha Ton Quyen Straße, Stadtteil Minh Phung, Ho-Chi-Minh-Stadt`,
        ru: `${numberText}, улица Ха Тон Куен, квартал Минь Фунг, Хошимин`,
        'zh-Hans': `胡志明市明凤坊河吨权街${numberText}`,
        'zh-Hant': `胡志明市明鳳坊河噸權街${numberText}`,
    };
};

const buildPoiTranslations = (item) => {
    const englishTranslation = POI_ENGLISH_TRANSLATIONS[item.name] || {
        name: item.name,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
    };

    const addressTranslations = buildAddressTranslations(item.address);

    const translations = {
        en: {
            name: englishTranslation.name || item.name,
            shortDescription:
                englishTranslation.shortDescription || item.shortDescription,
            fullDescription:
                englishTranslation.fullDescription || item.fullDescription,
            address: addressTranslations.en,
        },
    };

    for (const [lang, config] of Object.entries(CONTENT_LANGUAGE_LABELS)) {
        const categoryLabel =
            config[item.categorySlug] || config['mon-hoa'] || 'food';

        translations[lang] = {
            name: translations.en.name,
            shortDescription: config.short(translations.en.name, categoryLabel),
            fullDescription: config.full(translations.en.name, categoryLabel),
            address: addressTranslations[lang] || addressTranslations.en,
        };
    }

    return translations;
};

const buildMenuTranslations = (menuName) => {
    const dictionary = MENU_NAME_TRANSLATIONS[menuName] || {};
    const englishName = dictionary.en || menuName;

    return {
        en: { name: englishName },
        ja: { name: dictionary.ja || englishName },
        ko: { name: dictionary.ko || englishName },
        fr: { name: dictionary.fr || englishName },
        es: { name: dictionary.es || englishName },
        de: { name: dictionary.de || englishName },
        ru: { name: dictionary.ru || englishName },
        'zh-Hans': { name: dictionary['zh-Hans'] || englishName },
        'zh-Hant': { name: dictionary['zh-Hant'] || englishName },
    };
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

const seedRoles = async () => {
    await Promise.all(
        ROLE_SEEDS.map((role) =>
            Role.findOneAndUpdate(
                { code: role.code },
                {
                    $set: {
                        name: role.name,
                        description: role.description,
                        isActive: true,
                    },
                    $setOnInsert: {
                        code: role.code,
                    },
                },
                { upsert: true, new: true }
            )
        )
    );
};

const seedCategories = async () => {
    await Promise.all(
        CATEGORY_SEEDS.map((category) =>
            Category.findOneAndUpdate(
                { slug: category.slug },
                {
                    $set: {
                        name: category.name,
                        description: category.description,
                    },
                    $setOnInsert: {
                        slug: category.slug,
                    },
                },
                { upsert: true, new: true }
            )
        )
    );
};

const seedSuperAdmin = async () => {
    const adminRole = await Role.findOne({ code: 'ADMIN' }).select('_id code');

    if (!adminRole) {
        throw new Error('ADMIN role is not available after seeding roles');
    }

    const adminEmail = normalizeEmail(SUPER_ADMIN_EMAIL);
    const adminUsername = normalizeUsername(SUPER_ADMIN_USERNAME);
    const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

    return User.findOneAndUpdate(
        { $or: [{ email: adminEmail }, { username: adminUsername }] },
        {
            $set: {
                fullName: 'Super Admin',
                email: adminEmail,
                username: adminUsername,
                passwordHash,
                role: adminRole._id,
                roleCode: 'admin',
                status: 'active',
                accountStatus: 'active',
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const seedUsersAndOwners = async () => {
    const ownerRole = await Role.findOne({ code: 'OWNER' }).select('_id');
    const userRole = await Role.findOne({ code: 'USER' }).select('_id');

    if (!ownerRole || !userRole) {
        throw new Error('OWNER/USER role missing');
    }

    const ownerSeeds = [
        {
            fullName: 'Trần Minh Long',
            email: 'owner.long@smartfoodtour.vn',
            businessName: 'Nhà hàng Đông Phúc',
            businessAddress: '18 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
        },
        {
            fullName: 'Lý Ngọc Mai',
            email: 'owner.mai@smartfoodtour.vn',
            businessName: 'Dimsum Hải Ký Signature',
            businessAddress: '42 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
        },
        {
            fullName: 'Nguyễn Bảo Châu',
            email: 'owner.chau@smartfoodtour.vn',
            businessName: 'Trà Đạo Phượng Hoàng',
            businessAddress: '72 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
        },
        {
            fullName: 'Vương Gia Huy',
            email: 'owner.huy@smartfoodtour.vn',
            businessName: 'Lẩu Tứ Xuyên Hoàng Gia',
            businessAddress: '88 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
        },
        {
            fullName: 'Phạm Thu Hà',
            email: 'owner.ha@smartfoodtour.vn',
            businessName: 'Bánh Bao Thượng Hải',
            businessAddress: '28 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
        },
    ];

    const userSeeds = [
        {
            fullName: 'Lê Anh Tuấn',
            email: 'user.tuan@smartfoodtour.vn',
        },
        {
            fullName: 'Ngô Thu Trang',
            email: 'user.trang@smartfoodtour.vn',
        },
        {
            fullName: 'Trương Minh Khôi',
            email: 'user.khoi@smartfoodtour.vn',
        },
        {
            fullName: 'Đỗ Quỳnh Anh',
            email: 'user.quynhanh@smartfoodtour.vn',
        },
        {
            fullName: 'Phan Gia Bảo',
            email: 'user.giabao@smartfoodtour.vn',
        },
    ];

    const defaultPasswordHash = await hashPassword('User@123456');

    const owners = [];

    for (const item of ownerSeeds) {
        const email = normalizeEmail(item.email);

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                fullName: item.fullName,
                email,
                passwordHash: defaultPasswordHash,
                role: ownerRole._id,
                roleCode: 'owner',
                status: 'active',
                accountStatus: 'active',
            });
        }

        let ownerProfile = await OwnerProfile.findOne({ user: user._id });

        if (!ownerProfile) {
            ownerProfile = await OwnerProfile.create({
                user: user._id,
                businessName: item.businessName,
                businessAddress: item.businessAddress,
                idCardNumber: `ID${String(user._id).slice(-8).toUpperCase()}`,
                status: 'approved',
            });
        } else {
            ownerProfile.businessName = item.businessName;
            ownerProfile.businessAddress = item.businessAddress;
            ownerProfile.status = 'approved';
            await ownerProfile.save();
        }

        owners.push({ user, ownerProfile });
    }

    const users = [];

    for (const item of userSeeds) {
        const email = normalizeEmail(item.email);

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                fullName: item.fullName,
                email,
                passwordHash: defaultPasswordHash,
                role: userRole._id,
                roleCode: 'user',
                status: 'active',
                accountStatus: 'active',
            });
        }

        users.push(user);
    }

    return { owners, users };
};

const seedPOIs = async (owners) => {
    const categories = await Category.find().select('_id name slug');

    if (!categories.length) {
        throw new Error('No categories available to seed POIs');
    }

    const poiSeeds = [
        {
            name: 'Sweet Hut - Chè Kiểu Hồng Kông',
            address: '124 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Chè kiểu Hồng Kông và món ngọt tráng miệng.',
            fullDescription:
                'Sweet Hut là điểm dừng tráng miệng quen thuộc trên đường Hà Tôn Quyền, phù hợp ăn sau khi thưởng thức sủi cảo và các món Hoa.',
            lat: 10.7572382,
            lng: 106.652821,
            geofenceRadius: 65,
            audioPriority: 1,
            categorySlug: 'nuoc-uong',
            images: [
                'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Mì Kéo Kungfu Khải Ký - Điểm Tâm Hongkong',
            address: '116 - 118 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Mì kéo tay và điểm tâm phong cách Hong Kong.',
            fullDescription:
                'Khải Ký nổi bật với mì kéo tay, điểm tâm và các món Hoa quen thuộc trên trục Hà Tôn Quyền.',
            lat: 10.7570252,
            lng: 106.6528842,
            geofenceRadius: 70,
            audioPriority: 2,
            categorySlug: 'mi-hu-tieu',
            images: [
                'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Trà Sữa MayCha - Hà Tôn Quyền',
            address: '127 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Trà sữa và nước uống mang đi.',
            fullDescription:
                'MayCha là điểm dừng thuận tiện cho trà sữa, trà trái cây và các loại đồ uống mang đi khi khám phá Hà Tôn Quyền.',
            lat: 10.7569791,
            lng: 106.6525978,
            geofenceRadius: 60,
            audioPriority: 3,
            categorySlug: 'nuoc-uong',
            images: [
                'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo 132',
            address: '132 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Quán sủi cảo nhỏ trên đường Hà Tôn Quyền.',
            fullDescription:
                'Sủi Cảo 132 là điểm ăn bình dân với sủi cảo và món Hoa quen thuộc, phù hợp cho bữa ăn nhanh.',
            lat: 10.757381,
            lng: 106.6528316,
            geofenceRadius: 70,
            audioPriority: 4,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sữa Chua Trân Châu Hạ Long',
            address: '144A Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Sữa chua trân châu và món tráng miệng ngọt.',
            fullDescription:
                'Đây là điểm dừng nhẹ nhàng với sữa chua trân châu và các món ngọt, phù hợp nghỉ chân giữa hành trình food tour.',
            lat: 10.7575468,
            lng: 106.6528083,
            geofenceRadius: 60,
            audioPriority: 5,
            categorySlug: 'nuoc-uong',
            images: [
                'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Cường Ký Mì Gia',
            address: '157 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Mì gia và món nước đậm vị người Hoa.',
            fullDescription:
                'Cường Ký Mì Gia nổi bật với mì, hoành thánh và nước dùng đậm vị, là một trong các địa điểm ăn quen thuộc trên trục Hà Tôn Quyền.',
            lat: 10.7573419,
            lng: 106.6526762,
            geofenceRadius: 75,
            audioPriority: 6,
            categorySlug: 'mi-hu-tieu',
            images: [
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo 162',
            address: '162 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Quán sủi cảo nổi tiếng trong khu Hà Tôn Quyền.',
            fullDescription:
                'Sủi Cảo 162 là địa điểm quen thuộc với nhiều thực khách yêu thích món sủi cảo nước, mì khô và các món Hoa bình dân.',
            lat: 10.7579076,
            lng: 106.6528365,
            geofenceRadius: 75,
            audioPriority: 7,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Tiệm Trà Happy & Hotdog - Hà Tôn Quyền',
            address: '169 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Đồ uống và món ăn nhẹ mang đi.',
            fullDescription:
                'Happy & Hotdog phục vụ trà, nước uống và đồ ăn nhẹ, phù hợp để dừng chân nhanh khi đi dọc Hà Tôn Quyền.',
            lat: 10.7576312,
            lng: 106.6526564,
            geofenceRadius: 60,
            audioPriority: 8,
            categorySlug: 'nuoc-uong',
            images: [
                'https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo 175',
            address: '175 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Quán sủi cảo đông khách trên tuyến Hà Tôn Quyền.',
            fullDescription:
                'Sủi Cảo 175 là một quán ăn quen thuộc với thực khách khu này, phục vụ sủi cảo và các món Hoa phong cách bình dân.',
            lat: 10.7577735,
            lng: 106.6525818,
            geofenceRadius: 75,
            audioPriority: 9,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Cháo Lòng Bò',
            address: '184 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Cháo lòng bò nổi tiếng trong khu phố ẩm thực.',
            fullDescription:
                'Cháo Lòng Bò là điểm ăn quen thuộc với món cháo lòng bò đậm vị, được nhiều thực khách nhắc tới trong khu Hà Tôn Quyền.',
            lat: 10.7582838,
            lng: 106.6527702,
            geofenceRadius: 70,
            audioPriority: 10,
            categorySlug: 'mon-hoa',
            images: [
                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo Ngọc Ý',
            address: '187 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Tiệm sủi cảo lâu năm trên đường Hà Tôn Quyền.',
            fullDescription:
                'Ngọc Ý là một trong những tiệm sủi cảo được nhắc đến nhiều ở khu Hà Tôn Quyền, phù hợp cho bữa ăn nhanh hoặc khám phá food tour.',
            lat: 10.7579091,
            lng: 106.6526478,
            geofenceRadius: 80,
            audioPriority: 10,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo Thuận Hảo',
            address: '193 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Sủi cảo và món Hoa bình dân.',
            fullDescription:
                'Thuận Hảo là một điểm ăn trong khu Hà Tôn Quyền được nhiều thực khách biết tới với các món sủi cảo và món Hoa giá phổ thông.',
            lat: 10.7580487,
            lng: 106.6526504,
            geofenceRadius: 80,
            audioPriority: 10,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Sủi Cảo Thiên Thiên',
            address: '195 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Sủi cảo nổi tiếng và đông khách về đêm.',
            fullDescription:
                'Thiên Thiên là một địa chỉ sủi cảo nổi tiếng trong khu Hà Tôn Quyền, thường đông khách vào buổi chiều tối và tối muộn.',
            lat: 10.7580797,
            lng: 106.6526393,
            geofenceRadius: 85,
            audioPriority: 10,
            categorySlug: 'dimsum',
            images: [
                'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Quán Ăn Sen Nguyên',
            address: '255 Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Quán ăn bình dân với món cơm và món Hoa.',
            fullDescription:
                'Sen Nguyên là quán ăn phục vụ cơm và món mặn theo phong cách bình dân, phù hợp cho khách muốn ăn no trong khu vực Hà Tôn Quyền.',
            lat: 10.7593544,
            lng: 106.6525647,
            geofenceRadius: 75,
            audioPriority: 10,
            categorySlug: 'mon-hoa',
            images: [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            ],
        },
        {
            name: 'Cà Phê, Cam Vắt & Trà Tắc - Hà Tôn Quyền',
            address: '167A Hà Tôn Quyền, Phường Minh Phụng, TP.HCM',
            shortDescription: 'Cà phê và đồ uống giải khát trên tuyến Hà Tôn Quyền.',
            fullDescription:
                'Đây là điểm dừng nhanh cho cà phê, cam vắt và trà tắc, phù hợp để giải khát trong lúc khám phá khu ẩm thực Hà Tôn Quyền.',
            lat: 10.7575733,
            lng: 106.6526582,
            geofenceRadius: 60,
            audioPriority: 10,
            categorySlug: 'nuoc-uong',
            images: [
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
            ],
        },
    ];

    const pois = [];

    for (let index = 0; index < poiSeeds.length; index += 1) {
        const item = poiSeeds[index];

        const category = categories.find(
            (current) => current.slug === item.categorySlug
        );

        if (!category) {
            throw new Error(`Missing category slug: ${item.categorySlug}`);
        }

        const ownerProfile =
            owners[index % owners.length]?.ownerProfile?._id || null;

        const poi = await POI.create({
            name: item.name,
            address: item.address,
            translations: buildPoiTranslations(item),
            shortDescription: item.shortDescription,
            fullDescription: item.fullDescription,
            images: item.images,
            lat: item.lat,
            lng: item.lng,
            geofenceRadius: item.geofenceRadius,
            audioPriority: item.audioPriority,
            isVisible: true,
            category: category._id,
            ownerProfile,
            status: 'active',
        });

        pois.push(poi);
    }

    console.log(`Seed POIs completed: ${pois.length} records inserted.`);
    console.log(`Total POIs in MongoDB: ${await POI.countDocuments()}`);

    return pois;
};

const seedMenuItems = async (pois) => {
    if (!Array.isArray(pois) || pois.length === 0) {
        console.log('Seed menu items skipped: missing POIs.');
        return [];
    }

    const categories = await Category.find().select('_id slug name').lean();

    const categorySlugById = new Map(
        categories.map((category) => [
            String(category._id),
            category.slug,
        ])
    );

    const MENU_BY_CATEGORY = {
        dimsum: [
            {
                name: 'Há cảo tôm',
                price: 48000,
                category: 'Dimsum',
                imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Xíu mại trứng cua',
                price: 52000,
                category: 'Dimsum',
                imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Bánh bao kim sa',
                price: 45000,
                category: 'Dimsum',
                imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Chân gà tàu xì',
                price: 58000,
                category: 'Dimsum',
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Bánh cuốn tôm hấp',
                price: 62000,
                category: 'Dimsum',
                imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
            },
        ],

        'mi-hu-tieu': [
            {
                name: 'Mì vằn thắn đặc biệt',
                price: 65000,
                category: 'Mì - Hủ tiếu',
                imageUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Mì hoành thánh xá xíu',
                price: 62000,
                category: 'Mì - Hủ tiếu',
                imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Hủ tiếu sa tế bò',
                price: 70000,
                category: 'Mì - Hủ tiếu',
                imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Mì khô sốt dầu hào',
                price: 58000,
                category: 'Mì - Hủ tiếu',
                imageUrl: 'https://images.unsplash.com/photo-1634864572865-1cf8ffb529f6?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Hủ tiếu xào giòn',
                price: 72000,
                category: 'Mì - Hủ tiếu',
                imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=80',
            },
        ],

        lau: [
            {
                name: 'Lẩu uyên ương',
                price: 289000,
                category: 'Lẩu',
                imageUrl: 'https://images.unsplash.com/photo-1625943555419-56a2cb596640?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Lẩu Tứ Xuyên cay',
                price: 319000,
                category: 'Lẩu',
                imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Lẩu hải sản',
                price: 349000,
                category: 'Lẩu',
                imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Bò viên Tứ Xuyên',
                price: 89000,
                category: 'Lẩu',
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Combo rau nấm lẩu',
                price: 79000,
                category: 'Lẩu',
                imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80',
            },
        ],

        'nuoc-uong': [
            {
                name: 'Trà ô long thượng hạng',
                price: 42000,
                category: 'Nước uống',
                imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Trà phổ nhĩ ủ lâu năm',
                price: 58000,
                category: 'Nước uống',
                imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Trà sữa trân châu',
                price: 45000,
                category: 'Nước uống',
                imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Trà đào cam sả',
                price: 49000,
                category: 'Nước uống',
                imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Nước mát thảo mộc',
                price: 35000,
                category: 'Nước uống',
                imageUrl: 'https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?auto=format&fit=crop&w=1200&q=80',
            },
        ],

        'mon-hoa': [
            {
                name: 'Cơm chiên Dương Châu',
                price: 69000,
                category: 'Món Hoa',
                imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Vịt quay Bắc Kinh',
                price: 320000,
                category: 'Món Hoa',
                imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Gà hấp hành gừng',
                price: 185000,
                category: 'Món Hoa',
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Mì xào hải sản',
                price: 89000,
                category: 'Món Hoa',
                imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
            },
            {
                name: 'Đậu hũ Tứ Xuyên',
                price: 78000,
                category: 'Món Hoa',
                imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            },
        ],
    };

    const menuItemsToInsert = [];

    for (const poi of pois) {
        const categorySlug = categorySlugById.get(String(poi.category));
        const menuItems = MENU_BY_CATEGORY[categorySlug] || MENU_BY_CATEGORY['mon-hoa'];

        for (let index = 0; index < menuItems.length; index += 1) {
            const item = menuItems[index];

            menuItemsToInsert.push({
                itemCode: `MENU_${String(poi._id).slice(-6).toUpperCase()}_${index + 1}`,
                name: item.name,
                translations: buildMenuTranslations(item.name),
                poiId: poi._id,
                price: item.price,
                imageUrl: item.imageUrl,
                category: item.category,
                status: 'active',
            });
        }
    }

    const insertedItems = await MenuItem.insertMany(menuItemsToInsert);

    console.log(
        `Seed menu items completed: ${insertedItems.length} records inserted.`
    );

    console.log('Each POI now has 5 active featured menu items.');

    return insertedItems;
};

const seedReviews = async (pois, users) => {
    const contents = [
        'Món ăn rất ngon, phục vụ nhanh và nhiệt tình.',
        'Không gian đẹp, phù hợp đi cùng gia đình.',
        'Vị lẩu đậm đà, sẽ quay lại lần sau.',
        'Trà thơm, nhẹ nhàng, rất thư giãn.',
        'Giá hợp lý so với chất lượng món.',
        'Phục vụ chuyên nghiệp, món lên đều.',
        'Hơi đông vào cuối tuần nhưng vẫn ổn.',
        'Khẩu vị chuẩn Hoa, mình rất thích.',
        'Bàn ghế sạch sẽ, quán gọn gàng.',
        'Đáng thử nếu đi food tour khu này.',
    ];

    for (let index = 0; index < contents.length; index += 1) {
        const poi = pois[index % pois.length];
        const user = users[index % users.length];

        await Review.findOneAndUpdate(
            {
                poiId: poi._id,
                userId: user._id,
                content: contents[index],
            },
            {
                $set: {
                    poiId: poi._id,
                    userId: user._id,
                    rating: (index % 5) + 1,
                    content: contents[index],
                    status: index % 4 === 0 ? 'hidden' : 'published',
                },
            },
            { upsert: true, new: true }
        );
    }
};

const seedUserFavorites = async (users, pois) => {
    if (
        !Array.isArray(users) ||
        users.length === 0 ||
        !Array.isArray(pois) ||
        pois.length === 0
    ) {
        return 0;
    }

    let inserted = 0;
    const limit = Math.min(users.length, pois.length, 6);

    for (let index = 0; index < limit; index += 1) {
        await UserFavorite.findOneAndUpdate(
            {
                userId: users[index]._id,
                poiId: pois[index]._id,
            },
            {
                $setOnInsert: {
                    userId: users[index]._id,
                    poiId: pois[index]._id,
                },
            },
            {
                upsert: true,
                new: true,
            }
        );

        inserted += 1;
    }

    console.log(`Seed user favorites completed: ${inserted} records upserted.`);

    return inserted;
};

const NARRATION_LANGUAGE_DEFS = [
    { code: 'vi', voice: 'Female (Nữ chuẩn)', demoFile: 'demo_vi.mp3' },
    { code: 'en', voice: 'Female (EN)', demoFile: 'demo_en.mp3' },
    { code: 'ko', voice: 'Female (KO)', demoFile: 'demo_ko.mp3' },
    { code: 'ja', voice: 'Female (JA)', demoFile: 'demo_ja.mp3' },
    { code: 'zh-Hans', voice: 'Female (ZH-Hans)', demoFile: 'demo_zh_hans.mp3' },
    { code: 'zh-Hant', voice: 'Female (ZH-Hant)', demoFile: 'demo_zh_hant.mp3' },
    { code: 'es', voice: 'Female (ES)', demoFile: 'demo_es.mp3' },
    { code: 'de', voice: 'Female (DE)', demoFile: 'demo_de.mp3' },
    { code: 'fr', voice: 'Female (FR)', demoFile: 'demo_fr.mp3' },
    { code: 'ru', voice: 'Female (RU)', demoFile: 'demo_ru.mp3' },
];

const DEMO_AUDIO_DIR = path.resolve(process.cwd(), 'public/uploads/demo');

const getTranslationEntry = (poi, languageCode) => {
    const translations = poi?.translations;
    if (!translations) return null;

    const normalizedCode = String(languageCode || '').trim();
    const baseCode = normalizedCode.split('-')[0];

    if (typeof translations.get === 'function') {
        return (
            translations.get(normalizedCode) ||
            translations.get(baseCode) ||
            translations.get('en') ||
            null
        );
    }

    return (
        translations[normalizedCode] ||
        translations[baseCode] ||
        translations.en ||
        null
    );
};

const compactText = (value, maxLength = 360) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;

    return `${text.slice(0, maxLength - 3).trim()}...`;
};

const getPoiLocalizedField = (poi, field, languageCode) => {
    if (typeof poi === 'string') {
        return field === 'name' ? poi : '';
    }

    if (String(languageCode || '').toLowerCase().startsWith('vi')) {
        return compactText(poi?.[field] || '');
    }

    const translation = getTranslationEntry(poi, languageCode);
    return compactText(translation?.[field] || poi?.[field] || '');
};

const buildNarrationContent = (poi, languageCode) => {
    const poiName = getPoiLocalizedField(poi, 'name', languageCode) || 'địa điểm';
    const introText =
        getPoiLocalizedField(poi, 'fullDescription', languageCode) ||
        getPoiLocalizedField(poi, 'shortDescription', languageCode) ||
        `${poiName} là một điểm dừng đáng chú ý trên tuyến food tour Hà Tôn Quyền.`;

    switch (languageCode) {
        case 'vi':
            return {
                title: `${poiName} · Thuyết minh`,
                shortText: `Giới thiệu ngắn về ${poiName}.`,
                fullText: introText,
                script: `Xin chào, bạn đang đến gần ${poiName}. ${introText} Hãy dừng lại một chút để cảm nhận món đặc trưng, nhịp phục vụ và không khí rất riêng của khu phố ẩm thực Hà Tôn Quyền.`,
            };

        case 'en':
            return {
                title: `${poiName} · Narration`,
                shortText: `A short introduction to ${poiName}.`,
                fullText: introText,
                script: `Hello, you are approaching ${poiName}. ${introText} Take a moment to notice the signature flavors, the pace of service, and the local food-street atmosphere around Ha Ton Quyen.`,
            };

        case 'ko':
            return {
                title: `${poiName} · 오디오 안내`,
                shortText: `${poiName}에 대한 짧은 소개입니다.`,
                fullText: introText,
                script: `안녕하세요. 지금 ${poiName} 근처에 도착하고 있습니다. ${introText} 대표 메뉴와 하톤꾸옌 음식 거리의 활기 있는 분위기를 함께 즐겨 보세요.`,
            };

        case 'ja':
            return {
                title: `${poiName}・音声ガイド`,
                shortText: `${poiName}の簡単な紹介です。`,
                fullText: introText,
                script: `こんにちは。まもなく${poiName}に到着します。${introText} おすすめ料理とハートンクエン通りならではのにぎわいをゆっくりお楽しみください。`,
            };

        case 'zh-Hans':
            return {
                title: `${poiName} · 语音介绍`,
                shortText: `关于 ${poiName} 的简短介绍。`,
                fullText: introText,
                script: `你好，你现在正接近 ${poiName}。${introText} 不妨停下来品尝招牌风味，也感受河屯权美食街热闹而亲切的氛围。`,
            };

        case 'zh-Hant':
            return {
                title: `${poiName} · 語音介紹`,
                shortText: `關於 ${poiName} 的簡短介紹。`,
                fullText: introText,
                script: `你好，你現在正接近 ${poiName}。${introText} 不妨停下來品嚐招牌風味，也感受河屯權美食街熱鬧而親切的氛圍。`,
            };

        case 'es':
            return {
                title: `${poiName} · Narración`,
                shortText: `Una breve introducción a ${poiName}.`,
                fullText: introText,
                script: `Hola, te estás acercando a ${poiName}. ${introText} Tómate un momento para probar sus sabores principales y sentir el ambiente local de la calle Ha Ton Quyen.`,
            };

        case 'de':
            return {
                title: `${poiName} · Audioguide`,
                shortText: `Eine kurze Einführung zu ${poiName}.`,
                fullText: introText,
                script: `Hallo, du näherst dich ${poiName}. ${introText} Nimm dir einen Moment für die Spezialitäten des Hauses und die lebendige Atmosphäre der Ha Ton Quyen Straße.`,
            };

        case 'fr':
            return {
                title: `${poiName} · Narration`,
                shortText: `Une courte présentation de ${poiName}.`,
                fullText: introText,
                script: `Bonjour, vous arrivez près de ${poiName}. ${introText} Prenez le temps de découvrir ses saveurs principales et l'ambiance vivante de la rue Ha Ton Quyen.`,
            };

        case 'ru':
            return {
                title: `${poiName} · Аудиогид`,
                shortText: `Краткое описание ${poiName}.`,
                fullText: introText,
                script: `Здравствуйте, вы приближаетесь к ${poiName}. ${introText} Остановитесь ненадолго, попробуйте фирменные вкусы и почувствуйте живую атмосферу улицы Ха Тон Куен.`,
            };

        default:
            return {
                title: `${poiName} · Narration`,
                shortText: `A short introduction to ${poiName}.`,
                fullText: introText,
                script: `Hello, you are approaching ${poiName}. ${introText} This stop is part of the Ha Ton Quyen food route, so take a moment to explore its flavors and atmosphere.`,
            };
    }
};

const ensureDemoAudioFolder = async () => {
    await fs.promises.mkdir(DEMO_AUDIO_DIR, { recursive: true });

    const missingFiles = [];

    for (const item of NARRATION_LANGUAGE_DEFS) {
        const fullPath = path.join(DEMO_AUDIO_DIR, item.demoFile);

        if (!fs.existsSync(fullPath)) {
            missingFiles.push(item.demoFile);
        }
    }

    if (missingFiles.length > 0) {
        console.warn(
            '[seed] Missing demo audio files in uploads/demo/:',
            missingFiles.join(', ')
        );
        console.warn(
            '[seed] Tạm thời có thể copy cùng 1 file mp3 mẫu thành các tên trên để app phát được.'
        );
    }
};

const seedNarrations = async (pois, owners) => {
    if (!Array.isArray(pois) || pois.length === 0) {
        console.log('Seed narrations skipped: missing POIs.');
        return [];
    }

    const narrations = [];

    for (let poiIndex = 0; poiIndex < pois.length; poiIndex += 1) {
        const poi = pois[poiIndex];

        for (let langIndex = 0; langIndex < NARRATION_LANGUAGE_DEFS.length; langIndex += 1) {
            const languageDef = NARRATION_LANGUAGE_DEFS[langIndex];
            const ownerUser =
                owners[(poiIndex + langIndex) % owners.length]?.user || null;

            const content = buildNarrationContent(poi, languageDef.code);

            const narration = await Narration.findOneAndUpdate(
                {
                    poi: poi._id,
                    language: languageDef.code,
                },
                {
                    $set: {
                        poi: poi._id,
                        language: languageDef.code,
                        title: content.title,
                        script: content.script,
                        shortText: content.shortText,
                        fullText: content.fullText,
                        images: [
                            `https://picsum.photos/seed/${encodeURIComponent(
                                `${poi.name}-${languageDef.code}`
                            )}/900/600`,
                        ],
                        status: 'published',
                        submittedBy: ownerUser?._id || null,
                        rejectedReason: null,
                    },
                },
                {
                    upsert: true,
                    new: true,
                }
            );

            narrations.push(narration);
        }
    }

    console.log(
        `Seed narrations completed: ${narrations.length} records upserted.`
    );

    return narrations;
};

const seedAudioAssets = async (narrations, pois) => {
    if (!Array.isArray(narrations) || narrations.length === 0) {
        console.log('Seed audio assets skipped: missing narrations.');
        return 0;
    }

    let inserted = 0;

    for (let index = 0; index < narrations.length; index += 1) {
        const narration = narrations[index];
        const languageDef = NARRATION_LANGUAGE_DEFS.find(
            (item) => item.code === narration.language
        );

        if (!languageDef) {
            continue;
        }

        const fileName = languageDef.demoFile;
        const fullPath = path.join(DEMO_AUDIO_DIR, fileName);

        if (!fs.existsSync(fullPath)) {
            await AudioAsset.deleteOne({
                poi: narration.poi,
                narration: narration._id,
                language: narration.language,
            });
            continue;
        }

        const audioUrl = `/uploads/demo/${fileName}`;

        await AudioAsset.findOneAndUpdate(
            {
                poi: narration.poi,
                narration: narration._id,
                language: narration.language,
            },
            {
                $set: {
                    poi: narration.poi,
                    narration: narration._id,
                    language: narration.language,
                    audioUrl,
                    fileName,
                    sourceType: 'tts',
                    duration: 45 + (index % 8) * 3,
                    status: 'completed',
                    voice: languageDef.voice,
                },
            },
            {
                upsert: true,
                new: true,
            }
        );

        inserted += 1;
    }

    console.log(`Seed audio assets completed: ${inserted} records upserted.`);

    return inserted;
};

const runSeed = async () => {
    try {
        await connectDB();

        await ensureDemoAudioFolder();

        await Promise.all([
            POI.deleteMany({}),
            MenuItem.deleteMany({}),
            Review.deleteMany({}),
            Narration.deleteMany({}),
            AudioAsset.deleteMany({}),
            UserFavorite.deleteMany({}),
        ]);

        console.log('Cleared old POIs, menu items, reviews, favorites, narrations, and audio assets.');

        await seedRoles();
        await seedCategories();

        const adminUser = await seedSuperAdmin();

        const { owners, users } = await seedUsersAndOwners();

        const pois = await seedPOIs(owners);

        await seedMenuItems(pois);
        await seedReviews(pois, users);
        await seedUserFavorites(users, pois);

        const narrations = await seedNarrations(pois, owners);
        const audioAssetsCount = await seedAudioAssets(narrations, pois);

        console.log(
            `Seed verification -> narrations: ${narrations.length}, audioAssets: ${audioAssetsCount}`
        );

        console.log('Seed completed successfully');

        console.log(
            `Default admin account -> email: ${adminUser.email}, password: ${
                SUPER_ADMIN_PASSWORD
            }, role: admin`
        );
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        try {
            await require('mongoose').connection.close();
        } catch {
            // ignore close errors on seed shutdown
        }
    }
};

runSeed();
