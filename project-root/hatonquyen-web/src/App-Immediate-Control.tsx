import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { MiniTTSPlayer } from './components/MiniTTSPlayer';
import { getAuthSession, getRedirectPathBySession, getRoleCode } from './app/services/auth-state.service';
import AdminLayout from './app/layouts/AdminLayout';
import { ttsEngine, TTSLanguage } from './core/tts/engine';
import { MapPin, Clock, Star, Globe, ChevronDown } from 'lucide-react';

const TTSTest = lazy(() => import('./app/pages/TTSTest'));
const LoginPage = lazy(() => import('./app/pages/Auth/Login'));
const UnauthorizedPage = lazy(() => import('./app/pages/Auth/Unauthorized'));
const Dashboard = lazy(() => import('./app/pages/Admin/Dashboard'));
const ManagePlaces = lazy(() => import('./app/pages/Admin/ManagePlaces'));
const ManageNarrations = lazy(() => import('./app/pages/Admin/ManageNarrations'));
const OwnerApproval = lazy(() => import('./app/pages/Admin/OwnerApproval'));
const ContentApproval = lazy(() => import('./app/pages/Admin/ContentApproval'));
const AdminMenuManagement = lazy(() => import('./app/components/admin/pages/menu-management-page'));
const ReviewManagement = lazy(() => import('./app/components/admin/pages/review-management-page'));
const ActiveOwners = lazy(() => import('./app/components/admin/pages/active-owners-page'));
const UserRoleManagement = lazy(() => import('./app/components/admin/pages/user-role-management-page'));
const AudioTasks = lazy(() => import('./app/components/admin/pages/audio-tasks-page'));
const AuditLogs = lazy(() => import('./app/components/admin/pages/audit-logs-page'));

type Destination = { name: string; description: string; address: string };
type LangItem = { code: TTSLanguage; label: string; short: string };

// i18n translations
const i18n: Record<TTSLanguage, Record<string, string>> = {
    'vi-VN': {
        subtitle: 'Khám phá ẩm thực phố Tàu với hướng dẫn âm thanh',
        mapTitle: 'Bản đồ Chinatown',
        mapSub: 'Các điểm đến sẽ được đánh dấu trên bản đồ',
        featured: 'Điểm đến nổi bật',
        listen: '🎧 Nghe giới thiệu',
        guide: '📱 Hướng dẫn sử dụng',
        step1: 'Nhấn "Nghe giới thiệu" tại điểm đến bạn muốn nghe',
        step2: 'Nhấn điểm khác sẽ tự động chuyển sang bài mới',
        step3: 'Nút Play: Phát/Phát lại | Nút Pause: Tạm dừng | Nút Stop: Dừng hẳn',
        nowPlaying: '🔊 Đang phát',
    },
    'en-US': {
        subtitle: 'Explore Chinatown cuisine with audio guide',
        mapTitle: 'Chinatown Map',
        mapSub: 'Destinations will be marked on the map',
        featured: 'Featured Destinations',
        listen: '🎧 Listen',
        guide: '📱 How to use',
        step1: 'Tap "Listen" on any destination to hear its intro',
        step2: 'Tap another to interrupt and switch immediately',
        step3: 'Play: Play/Restart | Pause: Pause/Resume | Stop: Stop completely',
        nowPlaying: '🔊 Now Playing',
    },
    'zh-CN': {
        subtitle: '用语音导览探索唐人街美食',
        mapTitle: '唐人街地图',
        mapSub: '目的地将在地图上标记',
        featured: '热门目的地',
        listen: '🎧 收听介绍',
        guide: '📱 使用说明',
        step1: '点击任何目的地的"收听介绍"即可收听',
        step2: '点击其他目的地会立即切换',
        step3: '播放：播放/重播 | 暂停：暂停/恢复 | 停止：完全停止',
        nowPlaying: '🔊 正在播放',
    },
    'ja-JP': {
        subtitle: '音声ガイドでチャイナタウンのグルメを探索',
        mapTitle: 'チャイナタウンマップ',
        mapSub: '目的地が地図上にマークされます',
        featured: '注目のスポット',
        listen: '🎧 音声を聞く',
        guide: '📱 使い方',
        step1: '「音声を聞く」をタップしてキューに追加',
        step2: '下部のミニプレーヤーで音声を操作',
        step3: '大きな金色のボタン: 再生/一時停止 | 小さなボタン: スキップ',
        nowPlaying: '🔊 再生中',
        queue: 'キュー内',
        ready: '再生準備完了...',
    },
    'fr-FR': {
        subtitle: 'Explorez la cuisine de Chinatown avec un guide audio',
        mapTitle: 'Carte de Chinatown',
        mapSub: 'Les destinations seront marquées sur la carte',
        featured: 'Destinations populaires',
        listen: '🎧 Écouter',
        guide: '📱 Comment utiliser',
        step1: 'Appuyez sur "Écouter" pour ajouter à la file d\'attente',
        step2: 'Utilisez le mini-lecteur en bas pour contrôler le son',
        step3: 'Gros bouton doré : Lecture/Pause | Petit bouton : Passer',
        nowPlaying: '🔊 En lecture',
        queue: 'en attente',
        ready: 'Prêt à lire...',
    },
};

// Multi-lang destination data — 4 điểm × 5 ngôn ngữ = 20 TTS sẵn
const destinationsI18n: Record<TTSLanguage, Destination[]> = {
    'vi-VN': [
        { name: 'Quán Dim Sum Phố Cổ', description: 'Quán Dim Sum Phố Cổ đã có mặt hơn sáu mươi năm, bắt đầu từ một xe hấp nhỏ giữa khu phố người Hoa và dần trở thành điểm hẹn của nhiều thế hệ thực khách. Bước qua cửa gỗ đỏ, bạn sẽ nghe tiếng xửng tre mở nắp, mùi bột gạo mới hấp quyện với dầu mè và gừng non lan khắp không gian. Mỗi mẻ há cảo được gói tay từng chiếc, lớp vỏ mỏng trong nhìn rõ phần tôm tươi giòn ngọt bên trong. Xíu mại thịt heo băm nhuyễn, nấm đông cô và trứng cua được hấp lửa vừa để giữ độ mọng. Khi chấm cùng nước tương ủ lâu năm pha giấm đen, vị mặn ngọt cân bằng tạo cảm giác thanh mà sâu, khiến bạn muốn thưởng thức thêm từng đĩa nhỏ.', address: '123 Phố Hàng Bạc' },
        { name: 'Nhà Hàng Bắc Kinh', description: 'Nhà Hàng Bắc Kinh nổi tiếng với món vịt quay chuẩn vị cung đình, nơi mỗi con vịt đều được tuyển chọn kỹ, hong gió tự nhiên và phết mật mạch nha trước khi vào lò than chuyên dụng. Tường gạch men xanh, đèn lồng đồng và bàn gỗ sẫm tạo nên bầu không khí trang trọng nhưng ấm cúng, như một căn bếp cổ ở khu thương cảng xưa. Khi đầu bếp thái vịt tại bàn, tiếng dao chạm thớt nghe dứt khoát, từng lát da mỏng bóng vàng xếp đều như cánh quạt. Cuốn cùng bánh tráng mỏng, dưa leo, hành lá và sốt đậu ngọt, vị giòn của da hòa với thịt mềm thơm tạo thành hậu vị kéo dài. Món canh xương vịt nấu cải thảo ăn kèm giúp cân bằng, khiến bữa ăn trở nên trọn vẹn.', address: '456 Phố Lãn Ông' },
        { name: 'Tiệm Bánh Nướng Trăng', description: 'Tiệm Bánh Nướng Trăng là thương hiệu gia truyền qua bốn thế hệ, vẫn giữ lò nướng gạch cũ và bàn nhào bột bằng gỗ lim đã nhuốm màu thời gian. Vào mùa cao điểm, cả con phố thơm nức mùi bơ, mạch nha và vỏ cam sấy khi từng mẻ bánh vừa ra lò còn nóng hổi. Nhân sen được sên chậm nhiều giờ đến khi mịn như nhung, quyện cùng lòng đỏ trứng muối chảy nhẹ tạo vị béo bùi hài hòa. Bột vỏ được cán nhiều lớp để khi nướng lên có độ mềm xốp, không khô và không gắt ngọt. Cắn một miếng, bạn cảm nhận rõ hương hạt, chút mằn mặn tinh tế rồi kết thúc bằng vị thơm dịu của trà hoa cúc phục vụ kèm. Đây là nơi nhiều gia đình chọn làm quà mỗi mùa đoàn viên.', address: '789 Phố Hàng Đường' },
        { name: 'Quán Phở Hoa Kiều', description: 'Quán Phở Hoa Kiều là điểm giao thoa thú vị giữa kỹ thuật ninh nước dùng kiểu Việt và nghệ thuật gia vị của bếp Hoa lâu đời. Nồi nước dùng được ninh qua đêm từ xương bò và xương ống, thêm quế, hồi, thảo quả nướng thơm cùng gừng cháy để tạo tầng hương sâu và sạch vị. Không gian quán mở, tường treo ảnh đen trắng về khu chợ cũ, tiếng chần bánh và tiếng dao thái thịt tạo nhịp điệu rất đời thường. Thịt bò được thái mỏng ngay trước giờ phục vụ, chần nhanh để giữ độ mềm ngọt, sau đó phủ hành hoa và rau mùi tươi. Khi thêm chút sa tế tôm và dấm tỏi nhà làm, bát phở trở nên đậm đà mà vẫn thanh. Mỗi thìa nước dùng nóng mang lại cảm giác ấm áp, như một bữa ăn nhà giữa hành trình khám phá phố ẩm thực.', address: '321 Phố Hàng Bông' },
    ],
    'en-US': [
        { name: 'Old Quarter Dim Sum', description: 'Old Quarter Dim Sum began more than sixty years ago as a tiny steaming cart in Chinatown and has grown into a beloved culinary landmark. As you walk in, bamboo steamers open in rhythm, releasing aromas of sesame oil, fresh dough, and young ginger into a warm wooden dining room. Every shrimp dumpling is folded by hand, with a translucent skin that reveals crisp, sweet seafood inside. Their siu mai blends minced pork, shiitake mushrooms, and a touch of roe, then steams gently to keep each bite juicy. Aged soy sauce mixed with black vinegar brings balance and depth without overpowering the natural sweetness. The meal unfolds in small plates, each one precise and comforting. It is the kind of place where stories are shared slowly, and one more basket always feels like the right decision.', address: '123 Hang Bac Street' },
        { name: 'Beijing Restaurant', description: 'Beijing Restaurant is celebrated for imperial-style Peking duck, prepared with strict timing and old-school charcoal roasting techniques. Each duck is air-dried, glazed with malt syrup, and roasted until the skin turns lacquered gold with a delicate crackle. Inside, blue ceramic walls, brass lanterns, and dark timber tables create a refined yet welcoming atmosphere that echoes the old trading quarter. The carving ritual happens at your table: thin, glossy slices are arranged with precision, then wrapped with cucumber, scallion, and sweet bean sauce in warm pancakes. The contrast is unforgettable—crisp skin, tender meat, fragrant steam. A light duck bone soup with napa cabbage follows, cleansing the palate and extending the experience. The restaurant does not rush you; every course is paced so you can notice texture, aroma, and the elegant balance that defines classic northern Chinese cuisine.', address: '456 Lan Ong Street' },
        { name: 'Moon Bakery', description: 'Moon Bakery is a four-generation artisan shop known for preserving the craft of traditional mooncakes without shortcuts. Their original brick oven still glows at dawn, while long wooden counters carry the scent of butter, malt, and candied citrus peel. Lotus seed paste is stirred slowly for hours until velvety, then paired with salted egg yolk to create a rich yet balanced center. The dough is laminated and rested carefully so the crust bakes soft, fine, and aromatic rather than dry or overly sweet. Fresh cakes come out warm, with a delicate sheen and layers that melt gently on the tongue. Served with chrysanthemum tea, each bite reveals nutty depth, silky sweetness, and a savory finish. Locals often queue here before festivals, not only for gifts but for the comfort of flavors that connect memory, craftsmanship, and celebration.', address: '789 Hang Duong Street' },
        { name: 'Hoa Kieu Pho House', description: 'Hoa Kieu Pho House is where Vietnamese broth-making meets the spice discipline of long-standing Chinese kitchens. The stock simmers overnight with marrow bones, cinnamon, star anise, cardamom, and charred ginger, producing a clear yet layered aroma that feels both familiar and new. Inside, open counters and vintage black-and-white photos of old market streets create an inviting, lived-in atmosphere. Beef is sliced to order and blanched quickly to keep its tenderness and natural sweetness, then finished with scallions, cilantro, and fresh herbs. Add a spoon of house-made chili shrimp paste and garlic vinegar, and the bowl becomes deeper, brighter, and more expressive. The noodles remain silky, never heavy, carrying broth in every strand. It is a satisfying stop that feels restorative—exactly the kind of meal travelers remember after a long day of walking and tasting through Chinatown.', address: '321 Hang Bong Street' },
    ],
    'zh-CN': [
        { name: '老街点心馆', description: '老街点心馆已有六十多年历史，最初只是华人街口一辆蒸笼小车，如今已成为本地人和游客都要打卡的经典老店。推门而入，木质桌椅与红灯笼营造出温暖怀旧的氛围，蒸笼掀开时的热气裹着芝麻油与姜香扑面而来。每一只虾饺都由师傅手工现包，晶莹薄皮内是新鲜弹牙的整只虾仁。烧卖以猪肉、冬菇和少量蟹籽调和，火候控制精准，入口饱满多汁。搭配陈年酱油和黑醋，咸鲜与甘甜层次分明，不抢原味。这里的点心节奏从容，一笼接一笼，让人边吃边聊，不知不觉就把一顿早餐吃成了一段有温度的城市记忆。', address: '银街123号' },
        { name: '北京饭店', description: '北京饭店以宫廷风味烤鸭闻名，选鸭、风干、挂糖、入炉每一步都严格按照老工序执行。炭火慢烤后的鸭皮色泽金亮，薄而脆，轻轻一咬便能听见清脆声响，鸭肉却依然柔嫩多汁。餐厅内部以青砖、铜灯与深色木桌构成沉稳雅致的空间，既有仪式感，也不失亲切。片鸭过程在桌边完成，师傅刀工利落，将皮肉分层切片，搭配薄饼、黄瓜丝、葱段和甜面酱卷食，口感层次非常完整。随后端上的鸭骨白菜汤清爽回甘，正好平衡前一道的丰厚油香。整套餐序节奏舒缓，适合慢慢体会经典北方料理的精细与气派，是一次兼具味觉与观感的深度体验。', address: '兰翁街456号' },
        { name: '月亮糕饼店', description: '月亮糕饼店是传承四代的手作老铺，至今仍使用老式砖炉与木案板，坚持不走捷径的烘焙方式。每天清晨，店里便弥漫着麦芽糖、黄油与橙皮丁的香气，整条街都能闻到刚出炉月饼的温暖甜香。莲蓉馅要慢火翻炒数小时，炒至细腻如绸，再包入咸蛋黄形成咸甜平衡。外皮经过反复醒面与压制，烘烤后松软细润，不干不腻。趁热切开时，馅心油润发亮，入口先是豆香与坚果香，随后是蛋黄的鲜咸回味。店家常配一杯菊花茶，让甜度更显清雅。每逢节庆，许多家庭都会专程来此选购，把这份老味道当作团圆时刻最稳妥的心意。', address: '糖街789号' },
        { name: '华侨粉馆', description: '华侨粉馆把越南汤底技法与中式香料层次结合得非常出色，是许多老饕反复回访的一站。汤锅从深夜开始熬煮，以牛骨和筒骨为底，加入桂皮、八角、草果和炭烤生姜，长时间慢熬后汤色清亮却滋味厚实。店内墙面挂着旧市场黑白照片，开放式操作台能看见烫粉、切肉、浇汤的完整过程，节奏利落而有烟火气。牛肉临上桌前现切现烫，保持柔嫩与肉香，再撒上葱花、香菜和当天新鲜香草。若再添一勺自制虾辣酱与蒜醋，风味会更立体，鲜、辣、酸彼此衬托。热汤入口温润而有力，既满足又不厚重，是旅途中最治愈的一碗。', address: '棉街321号' },
    ],
    'ja-JP': [
        { name: 'オールドクォーター・ディムサム', description: 'オールドクォーター・ディムサムは、かつて中華街の路地で小さな蒸し台から始まり、六十年以上にわたって広東点心の味を守り続けてきた名店です。店内に入ると、木の家具と赤い提灯が落ち着いた空気をつくり、蒸籠を開けるたびにごま油と生姜の香りがふわっと広がります。看板の海老餃子は一つずつ手包みで、薄く透ける皮の中に弾力のある海老の甘みが詰まっています。焼売は豚肉、椎茸、卵黄を丁寧に合わせ、しっとりとした食感に仕上げられています。黒酢を少し加えた熟成醤油で食べると、旨味の層がいっそう際立ち、会話を楽しみながら何籠でも食べ進めたくなる一軒です。', address: 'ハンバック通り 123' },
        { name: '北京レストラン', description: '北京レストランは、本格的な北京ダックを中心に据えた格式ある専門店で、下処理から焼き上げまで伝統工程を忠実に守っています。鴨は風乾の後に麦芽糖を塗り、炭火炉でじっくり焼くことで、黄金色で薄く軽い皮と、香り高く柔らかな肉質を同時に実現します。青いタイル壁、真鍮ランプ、深色の木製テーブルが並ぶ空間は、歴史ある食堂のような重厚さと温かさを兼ね備えています。職人がテーブル脇で切り分ける所作も見どころで、薄餅に胡 cucumber、葱、甜麺醤を巻けば、香ばしさと甘辛さが見事に調和します。仕上げの鴨骨白菜スープは後味を整え、コース全体を上品に締めくくります。', address: 'ランオン通り 456' },
        { name: 'ムーン・ベーカリー', description: 'ムーン・ベーカリーは四代続く手作り月餅の名店で、今も昔ながらの煉瓦窯と木製作業台を使い、丁寧な工程を守り続けています。早朝の店先には麦芽糖、バター、柑橘皮の甘い香りが立ち上がり、焼きたてを目当てに多くの常連が訪れます。蓮の実餡は長時間ゆっくりと練り上げられ、滑らかで艶のある口当たりに。そこへ塩漬け卵黄を合わせることで、甘さと塩味の輪郭が美しく重なります。生地は休ませと折りを繰り返してから焼かれ、しっとり柔らかく、重さのない後味に仕上がります。温かいうちに一口かじると、豆の香り、卵黄の旨味、ほのかな茶の余韻まで感じられ、旅の記憶に残る味わいです。', address: 'ハンドゥオン通り 789' },
        { name: 'ホアキエウ・フォー・ハウス', description: 'ホアキエウ・フォー・ハウスは、ベトナムの澄んだ出汁文化と中華の香辛料技術を融合させた、個性豊かなフォーの専門店です。スープは深夜から牛骨と筒骨を炊き、桂皮、八角、草果、香ばしく焼いた生姜を重ねることで、透明感のある見た目と奥行きのある香りを両立しています。店内には古い市場の白黒写真が飾られ、オープンキッチンでは湯通し、盛り付け、仕上げの流れが目の前で進みます。牛肉は注文ごとに薄切りされ、短時間で火入れするため柔らかさと旨味が際立ちます。自家製の海老辣油やにんにく酢を少量加えると、酸味と辛味が立ち上がり、最後の一口まで飽きずに楽しめます。', address: 'ハンボン通り 321' },
    ],
    'fr-FR': [
        { name: 'Old Quarter Dim Sum', description: 'Old Quarter Dim Sum est une adresse historique née d\'un petit chariot à vapeur dans l\'ancien quartier chinois, puis transmise de génération en génération pendant plus de soixante ans. Dès l\'entrée, le décor en bois, les lanternes rouges et le parfum de gingembre frais créent une ambiance chaleureuse và raffinée. Les raviolis aux crevettes sont pliés à la main, avec une pâte fine et translucide qui révèle une farce juteuse et croquante. Les siu mai associent porc haché, shiitaké et une touche d\'œuf salé, pour une texture tendre et savoureuse. Servis avec une sauce soja maturée et un filet de vinaigre noir, les bouchées gagnent en profondeur sans perdre leur délicatesse. Le service en petites assiettes invite à prendre son temps, à goûter, comparer et profiter d\'un véritable moment de découverte culinaire.', address: '123 rue Hang Bac' },
        { name: 'Restaurant de Pékin', description: 'Le Restaurant de Pékin est réputé pour son canard laqué préparé selon une méthode traditionnelle exigeante, depuis la sélection de la volaille jusqu\'à la cuisson lente au four à charbon. La peau devient fine, brillante et croustillante, tandis que la chair reste tendre, parfumée et délicatement juteuse. L\'intérieur, avec ses carreaux bleus, ses lampes en laiton et ses tables en bois sombre, rappelle les maisons de banquet d\'autrefois. Le découpage du canard se fait à table, dans un geste précis qui met en valeur chaque partie. Enroulé dans une crêpe légère avec concombre, cébette et sauce sucrée, chaque bouchée offre un équilibre remarquable entre texture, fraîcheur et intensité. Une soupe claire de carcasse au chou vient ensuite alléger le palais et prolonge l\'expérience avec élégance. C\'est une étape incontournable pour les amateurs de gastronomie chinoise classique.', address: '456 rue Lan Ong' },
        { name: 'Moon Bakery', description: 'Moon Bakery est une pâtisserie artisanale emblématique, dirigée par la même famille depuis quatre générations, qui perpétue des gestes précis et patients. Le four en brique d\'origine est encore utilisé chaque matin, diffusant dans la rue des notes de malt, de beurre et d\'écorce d\'agrumes confite. La pâte de lotus est travaillée longuement à feu doux jusqu\'à obtenir une texture soyeuse, puis mariée au jaune d\'œuf salé pour créer un cœur riche mais équilibré. La croûte, reposée et laminée avec soin, cuit en gardant une douceur moelleuse et une finesse agréable. Servi tiède avec un thé au chrysanthème, le gâteau révèle successivement des arômes de fruits secs, une pointe saline et une finale délicate. Pendant les fêtes, les habitants viennent ici chercher bien plus qu\'un dessert: un goût de mémoire et de partage.', address: '789 rue Hang Duong' },
        { name: 'Hoa Kieu Pho House', description: 'Hoa Kieu Pho House propose une interprétation remarquable du pho en réunissant la clarté du bouillon vietnamien et la précision des épices de tradition chinoise. Le bouillon mijote toute la nuit avec des os de bœuf, de la cannelle, de l\'anis étoilé, de la cardamome noire et du gingembre grillé, pour un résultat net, aromatique et profond. La salle, décorée de photos anciennes du marché, offre une atmosphère vivante et conviviale. Le bœuf est tranché à la minute puis plongé brièvement dans le bouillon, ce qui préserve sa tendreté et son goût naturel. Les herbes fraîches, la cébette et la coriandre apportent de la fraîcheur, tandis qu\'une touche de pâte de piment aux crevettes et de vinaigre à l\'ail renforce la complexité. Chaque cuillère est réconfortante, équilibrée et durable en bouche, parfaite pour reprendre la route avec énergie.', address: '321 rue Hang Bong' },
    ],
};

const destinationsMeta = [
    { id: 1, rating: 4.8, distance: '0.3 km' },
    { id: 2, rating: 4.9, distance: '0.5 km' },
    { id: 3, rating: 4.7, distance: '0.8 km' },
    { id: 4, rating: 4.6, distance: '1.2 km' },
];

const LANGUAGES: LangItem[] = [
    { code: 'vi-VN', label: '🇻🇳 Tiếng Việt', short: 'VI' },
    { code: 'en-US', label: '🇺🇸 English', short: 'EN' },
    { code: 'zh-CN', label: '🇨🇳 中文', short: 'ZH' },
    { code: 'ja-JP', label: '🇯🇵 日本語', short: 'JA' },
    { code: 'fr-FR', label: '🇫🇷 Français', short: 'FR' },
];

function App() {
    const renderLazyPage = (component: React.ReactNode) => (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            {component}
        </Suspense>
    );

    const pathname = window.location.pathname;
    const authSession = getAuthSession();
    const roleCode = getRoleCode(authSession);

    const isLoginPath = pathname === '/auth/login' || pathname === '/login';
    const isUnauthorizedPath = pathname === '/auth/unauthorized' || pathname === '/unauthorized';
    const isAdminPath = pathname.startsWith('/admin');

    if (isLoginPath && authSession?.accessToken) {
        const targetPath = getRedirectPathBySession(authSession);
        if (targetPath !== pathname) {
            window.location.replace(targetPath);
            return null;
        }
    }

    if (isAdminPath) {
        if (!authSession?.accessToken) {
            window.location.replace('/auth/login');
            return null;
        }

        if (roleCode !== 'ADMIN') {
            window.location.replace('/auth/unauthorized?reason=generic');
            return null;
        }

        let pageTitle = 'Dashboard';
        let pageElement: React.ReactNode = <Dashboard />;

        if (pathname === '/admin/manage-places') {
            pageTitle = 'Quản lý Địa điểm';
            pageElement = <ManagePlaces />;
        } else if (pathname === '/admin/manage-narrations') {
            pageTitle = 'Quản lý Thuyết minh';
            pageElement = <ManageNarrations />;
        } else if (pathname === '/admin/owner-approval') {
            pageTitle = 'Duyệt Chủ cửa hàng';
            pageElement = <OwnerApproval />;
        } else if (pathname === '/admin/content-approval') {
            pageTitle = 'Duyệt Nội dung';
            pageElement = <ContentApproval />;
        } else if (pathname === '/admin/menu') {
            pageTitle = 'Quản lý Menu';
            pageElement = <AdminMenuManagement />;
        } else if (pathname === '/admin/reviews') {
            pageTitle = 'Quản lý Đánh giá';
            pageElement = <ReviewManagement />;
        } else if (pathname === '/admin/active-owners') {
            pageTitle = 'Chủ cửa hàng hoạt động';
            pageElement = <ActiveOwners />;
        } else if (pathname === '/admin/users') {
            pageTitle = 'Người dùng & Phân quyền';
            pageElement = <UserRoleManagement />;
        } else if (pathname === '/admin/audio-tasks') {
            pageTitle = 'Dev TTS Test';
            pageElement = <AudioTasks />;
        } else if (pathname === '/admin/audit-logs') {
            pageTitle = 'Nhật ký hoạt động';
            pageElement = <AuditLogs />;
        }

        return renderLazyPage(
            <AdminLayout pageTitle={pageTitle}>
                {pageElement}
            </AdminLayout>
        );
    }

    if (isLoginPath) {
        return renderLazyPage(<LoginPage />);
    }

    if (isUnauthorizedPath) {
        return renderLazyPage(<UnauthorizedPage />);
    }

    if (pathname === '/' || pathname === '/index.html') {
        if (!authSession?.accessToken) {
            window.location.replace('/auth/login');
            return null;
        }

        if (roleCode === 'ADMIN') {
            window.location.replace('/admin');
            return null;
        }

        window.location.replace('/auth/unauthorized?reason=generic');
        return null;
    }

    if (authSession?.accessToken && roleCode === 'ADMIN') {
        window.location.replace('/admin');
        return null;
    }

    window.location.replace('/auth/login');
    return null;
}

export default App;
