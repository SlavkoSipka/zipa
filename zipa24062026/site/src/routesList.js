import HomePage from './views/homePage';
import CategoryPage from './views/categoryPage';
import DetailPage from './views/detailPage';

import DownloadsPage from './views/account/downloadsPage';

import CartPage from './views/cart/cartPage';
import LoginPage from './views/account/loginPage';
import RegisterPage from './views/account/registerPage';
import ResetPasswordPage from './views/account/resetPasswordPage';
import BlogPage from './views/blog/blogPage';
import BlogDetailPage from './views/blog/blogDetailPage';
import EditAccountPage from './views/account/editAccountPage';
import EmailVerifyPage from './views/account/emailVerifyPage';
import ChangePasswordPage from './views/account/changePasswordPage';
import DynamicPage from './views/dynamicPage';
import AccountCategoryPage from './views/account/categoryPage';
import AccountCategoriesPage from './views/account/categoriesPage';

import AccountNewsPage from './views/account/blogPage';
import AccountNewsItemPage from './views/account/blogItemPage';
import AccountUsersPage from './views/account/usersPage';
import AccountPagesPage from './views/account/pagesPage';
import AccountPageItemPage from './views/account/pageItemPage';
import AccountProfilePage from './views/account/profilePage';
import AccountChangePasswordPage from './views/account/changePassword';
import AccountPhotoVisitsPage from './views/account/photoVisits';
import AccountBannersPage from './views/account/bannersPage';
import AccountBannerPage from './views/account/bannerPage';
import TodayVisits from './views/account/todayVisits';
import GalleryStats from './views/account/galleryStats';
import PhotographerStats from './views/account/photographerStats';
import BannerStats from './views/account/bannerStats';

import AccountSlidesPage from './views/account/slidesPage';
import AccountSlidePage from './views/account/slidePage';
import AccountEditAdminUserPage from './views/account/editAdminUser';


import AccountFaqCategoriesPage from './views/account/faqCategoriesPage';
import AccountFaqCategoryPage from './views/account/faqCategoryPage';


import AccountFaqsPage from './views/account/faqsPage';
import AccountFaqPage from './views/account/faqPage';


import ChangeGallery from './views/account/changeGallery';


import ContactPage from './views/contactPage';
import PhotoPage from './views/photoPage';
import SiteSettings from './views/account/siteSettings';
import AgencySettings from './views/account/agencySettings';
import PhotographerPage from './views/photographerPage';
import GalleriesPage from './views/account/galleriesPage';
import LogsPage from './views/account/logsPage';
import DownloadLogs from './views/account/downloadLogs';
import AnnouncementsPage from './views/account/announcementsPage';
import AnnouncementPage from './views/account/announcementPage';
import HelpPage from './views/helpPage';
import FaqPage from './views/faqPage';
import AnnoucmentPage from './views/annoucmentPage';
import ErrorPage from './views/404';
import NewslettersPage from './views/account/newslettersPage';
import NewsletterPage from './views/account/newsletterPage';
import PreviewPage from './views/account/previewPage';

import SubscribersPage from './views/account/subscribers';
import ImportPage from './views/account/import';
import {API_ENDPOINT, PHOTOS_ENDPOINT} from './constants'


export const routes = [
    {
        path: "/",
        component: HomePage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Početna',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },
        loadData: [

            (fetchFunction, match) => {
                const testURL = `${API_ENDPOINT}/gallery/latest`
                return fetchFunction(`${API_ENDPOINT}/gallery/latest`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        latest: result,
                    }
                })
            },
            (fetchFunction, match) => {
                return fetchFunction(`${API_ENDPOINT}/categories/home`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        homeCategories: result,
                    }
                })
            },

            // Izdvojeno i video — koristi ih predlog B na dnu naslovne.
            (fetchFunction, match) => {
                return fetchFunction(`${API_ENDPOINT}/featured/all`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        izdvojeno: result,
                    }
                })
            },

            (fetchFunction, match) => {
                return fetchFunction(`${API_ENDPOINT}/videos/all`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        videos: result,
                    }
                })
            },

            (fetchFunction, match) => {
                return fetchFunction(`${API_ENDPOINT}/products/latest`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        latestProducts: result,
                    }
                })
            },


        ]
    },
    {
        path: "/account/preview/:id",
        component: PreviewPage,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },
    {
        path: "/account/profile",
        component: AccountProfilePage,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },
    {
        path: "/account/today-visits",
        component: TodayVisits,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },
    {
        path: "/account/gallery-stats",
        component: GalleryStats,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },
    {
        path: "/account/photographer-stats",
        component: PhotographerStats,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },
    {
        path: "/account/banner-stats",
        component: BannerStats,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Profil',
                description: 'Prva foto agencija u BiH',
                'og:url': 'https://zipaphoto.net',
                'og:type': 'website',
                'og:description': 'Prva foto agencija u BiH'
            }
        },

        loadData: []
    },


    {
        path: "/galerije",
        component: CategoryPage,
        generateSeoTags: (data) => {
            return {
                title: data.category && data.category.name ? data.category.name : 'Kategorije',
                description: data.storeData && data.storeData.aboutUs,
                'og:image': data.category && data.category.products && data.category.products[0] && data.category.products[0].images && data.category.products[0].images[0]
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }

                if (query && query['tags'] && typeof query['tags'] == 'string') {
                    query['tags'] = query['tags'].split(',');
                }
                if (query && query['category'] && typeof query['category'] == 'string') {
                    query['category'] = query['category'].split(',');
                }


                /*
                 * Prikaz „pojedinačne fotografije" traži po fotografijama, a ne
                 * po galerijama — na „Nikšić" se dobija baš ta fotografija, a
                 * ne ceo događaj od dvesta snimaka.
                 */
                const putanja = query && query.view === 'photos'
                    ? `${API_ENDPOINT}/photos/search`
                    : `${API_ENDPOINT}/gallery/search/${lang}`;

                return fetchFunction(putanja, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({query: query})
                }).then(res => res.json()).then((result) => {
                    return result
                })

            },


        ]
    },


    {
        path: "/account/subscription",
        component: CategoryPage,
        generateSeoTags: (data) => {
            return {
                title: data.category && data.category.name ? data.category.name : 'Kategorije',
                description: data.storeData && data.storeData.aboutUs,
                'og:image': data.category && data.category.products && data.category.products[0] && data.category.products[0].images && data.category.products[0].images[0]
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                query.subscription = 'true';
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }

                if (query && query['tags'] && typeof query['tags'] == 'string') {
                    query['tags'] = query['tags'].split(',');
                }
                if (query && query['category'] && typeof query['category'] == 'string') {
                    query['category'] = query['category'].split(',');
                }


                /*
                 * Prikaz „pojedinačne fotografije" traži po fotografijama, a ne
                 * po galerijama — na „Nikšić" se dobija baš ta fotografija, a
                 * ne ceo događaj od dvesta snimaka.
                 */
                const putanja = query && query.view === 'photos'
                    ? `${API_ENDPOINT}/photos/search`
                    : `${API_ENDPOINT}/gallery/search/${lang}`;

                return fetchFunction(putanja, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({query: query})
                }).then(res => res.json()).then((result) => {
                    return result
                })

            },


        ]
    },
    // {
    //     path: "/galerija/:photographer/:alias/:id",
    //     exact: true,
    //     component: DetailPage,
    //     generateSeoTags: (data) => {
    //         return {
    //             title: Object.translate(data, 'gallery.name', 'ba'),
    //             description: Object.translate(data, 'gallery.description', 'ba'),
    //             'og:image': '${PHOTOS_ENDPOINT}/photos/350x/'+ Object.get(data, 'gallery.photos[0].image')
    //         }
    //     },

    //     loadData: [
    //         (fetchFunction, match, pathname, query, lang) => {
    //             return fetchFunction(`${API_ENDPOINT}/gallery/get/${lang}/${match.params.alias}/${match.params.photographer}/${match.params.id}`, {
    //                 method: 'GET',
    //                 headers: {
    //                     'content-type': 'application/json'
    //                 },
    //             }).then(res => res.json()).then((result) => {
    //                 return {
    //                     gallery: result,
    //                 }
    //             })

    //         },


    //     ]
    // },
    {
        path: "/galerija/:alias/:id",
        exact: true,
        component: DetailPage,
        generateSeoTags: (data) => {
            return {
                title: Object.translate(data, 'gallery.name', 'ba'),
                description: Object.translate(data, 'gallery.description', 'ba'),
                'og:image': `${PHOTOS_ENDPOINT}/photos/350x/` + Object.get(data, 'gallery.photos[0].image')
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                return fetchFunction(`${API_ENDPOINT}/gallery/get/${lang}/${match.params.alias}/${match.params.id}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        gallery: result,
                    }
                })

            },


        ]
    },
    {
        path: "/fotograf/:photographer",
        exact: true,
        component: PhotographerPage,
        generateSeoTags: (data) => {
            return {
                title: data.product && data.product.name,
                description: data.product && data.product.shortDescription,
                'og:image': data.product && data.product.images && data.product.images[0]
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                return fetchFunction(`${API_ENDPOINT}/photographer/${match.params.photographer}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        photographer: result,
                    }
                })

            },


        ]
    },
    {
        path: "/galerija/:alias/:id/:photo",
        exact: true,
        component: PhotoPage,
        generateSeoTags: (data) => {
            return {
                title: Object.translate(data, 'gallery.name', 'ba'),
                description: Object.translate(data, 'gallery.description', 'ba'),
                'og:image': `${PHOTOS_ENDPOINT}/photos/350x/` + Object.get(data, 'gallery.photos[0].image')
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                return fetchFunction(`${API_ENDPOINT}/gallery/get/${lang}/${match.params.alias}/${match.params.id}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        gallery: result,
                    }
                })

            },
            (fetchFunction, match, pathname, query, lang) => {
                let authToken;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                } else {
                    return;
                }

                return fetchFunction(`${API_ENDPOINT}/gallery/check-resolutions/${lang}/${match.params.alias}/${match.params.id}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        allowedResolutions: result,
                    }
                })

            },


        ]
    },

    {
        path: "/account/edit",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: EditAccountPage,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: []
    },
    {
        path: "/account/agency-settings/:uid",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AgencySettings,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                let authToken;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                } else {
                    return;
                }


                return fetchFunction(`${API_ENDPOINT}/gallery/all/${match.params.uid}`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify(query)
                }).then(res => res.json()).then((result) => {
                    return result
                })

            }
            , (fetchFunction, match, pathname, query, lang) => {
                let authToken;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                } else {
                    return;
                }


                return fetchFunction(`${API_ENDPOINT}/gallery/user-resolutions/${match.params.uid}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                }).then(res => res.json()).then((result) => {
                    return {
                        initialValues: result
                    }
                })

            }


        ]
    },

    {
        path: "/account/settings",
        component: SiteSettings,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        exact: true,
        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },

        loadData: []
    },
    {
        path: "/account/gallery/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: ChangeGallery,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: []
    },
    {
        path: "/account/gallery-photographer/:uid/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: ChangeGallery,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: []
    },

    {
        path: "/account/change-password",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountChangePasswordPage,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: []
    },
    {
        path: "/account/photo-visits",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountPhotoVisitsPage,

        generateSeoTags: (data) => {
            return {
                title: 'Podešavanje',
            }
        },
        loadData: []
    },

    {
        path: "/account/downloads",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: DownloadsPage,
        generateSeoTags: (data) => {
            return {
                title: 'Moje narudzbe',
            }
        },
        loadData: [
            (fetchFunction, match, pathname, query) => {
                let authToken, cart;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }
                if (!query.page) {
                    query.page = 0;
                }
                if (!query.sort) {
                    query.sort = null;
                }

                return fetchFunction(`${API_ENDPOINT}/user/downloads/${query.page}/${query.sort}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        items: result.items,
                        total: result.total
                    }
                })
            },

        ]
    },
    {
        path: "/account/categories",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountCategoriesPage,
        generateSeoTags: (data) => {
            return {
                title: 'Kategorije',
            }
        },

        loadData: []
    },

    {
        path: "/account/categories/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountCategoryPage,
        generateSeoTags: (data) => {
            return {
                title: 'Kategorije',
            }
        },

        loadData: []
    },
    {
        path: "/account/users/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountEditAdminUserPage,
        generateSeoTags: (data) => {
            return {
                title: 'Korisnici',
            }
        },

        loadData: []
    },


    {
        path: "/account/banners",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountBannersPage,
        generateSeoTags: (data) => {
            return {
                title: 'Kategorije',
            }
        },

        loadData: []
    },

    {
        path: "/account/banners/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountBannerPage,
        generateSeoTags: (data) => {
            return {
                title: 'Kategorije',
            }
        },

        loadData: []
    },

    {
        path: "/account/slides",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountSlidesPage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },

    {
        path: "/account/slides/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountSlidePage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },
    {
        path: "/account/newsletter",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: NewslettersPage,
        generateSeoTags: (data) => {
            return {
                title: 'Newsletter',
            }
        },

        loadData: []
    },

    {
        path: "/account/subscribers",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: SubscribersPage,
        generateSeoTags: (data) => {
            return {
                title: 'Newsletter',
            }
        },

        loadData: []
    },
    {
        path: "/account/subscribers/import",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: ImportPage,
        generateSeoTags: (data) => {
            return {
                title: 'Newsletter',
            }
        },

        loadData: []
    },

    {
        path: "/account/newsletter/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: NewsletterPage,
        generateSeoTags: (data) => {
            return {
                title: 'Newsletter',
            }
        },

        loadData: []
    },


    {
        path: "/account/faqCategories",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountFaqCategoriesPage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },

    {
        path: "/account/faqCategories/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountFaqCategoryPage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },


    {
        path: "/account/faq",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountFaqsPage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },
    {
        path: "/help",
        exact: true,
        component: HelpPage,
        generateSeoTags: (data) => {
            return {
                title: 'Pomoć',
            }
        },

        loadData: []
    },
    {
        path: "/faq/:alias",
        exact: true,
        component: FaqPage,
        generateSeoTags: (data) => {
            return {
                title: 'Pomoć',
            }
        },

        loadData: []
    },

    {
        path: "/account/faq/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountFaqPage,
        generateSeoTags: (data) => {
            return {
                title: 'Slajder',
            }
        },

        loadData: []
    },


    {
        path: "/account/news",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountNewsPage,
        generateSeoTags: (data) => {
            return {
                title: 'Novosti',
            }
        },

        loadData: []
    },
    {
        path: "/account/pages",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountPagesPage,
        generateSeoTags: (data) => {
            return {
                title: 'Stranice',
            }
        },

        loadData: []
    },
    {
        path: "/account/pages/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountPageItemPage,
        generateSeoTags: (data) => {
            return {
                title: 'Stranice',
            }
        },

        loadData: []
    },
    {
        path: "/account/announcements",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AnnouncementsPage,
        generateSeoTags: (data) => {
            return {
                title: 'Stranice',
            }
        },

        loadData: []
    },
    {
        path: "/account/announcements/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AnnouncementPage,
        generateSeoTags: (data) => {
            return {
                title: 'Stranice',
            }
        },

        loadData: []
    },

    {
        path: "/account/news/:id",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountNewsItemPage,
        generateSeoTags: (data) => {
            return {
                title: 'Novosti',
            }
        },

        loadData: []
    },
    {
        path: "/account/users",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: AccountUsersPage,
        generateSeoTags: (data) => {
            return {
                title: 'Korisnici',
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }

                return fetchFunction(`${API_ENDPOINT}/users/all`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        page: query.page ? query.page : 0,
                        search: query.search ? query.search : null
                    })
                }).then(res => res.json()).then((result) => {
                    return {
                        items: result.items,
                        total: result.total
                    }
                })

            },

        ]
    },

    {
        path: "/account/logs",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: LogsPage,
        generateSeoTags: (data) => {
            return {
                title: 'Logovi',
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }

                return fetchFunction(`${API_ENDPOINT}/logs`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        page: query.page ? query.page : 0,
                        search: query.search ? query.search : null
                    })
                }).then(res => res.json()).then((result) => {
                    return {
                        items: result.items,
                        total: result.total
                    }
                })

            },

        ]
    },
    {
        path: "/account/download-logs",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: DownloadLogs,
        generateSeoTags: (data) => {
            return {
                title: 'Logovi',
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                }

                return fetchFunction(`${API_ENDPOINT}/downloads`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        page: query.page ? query.page : 0,
                        search: query.search ? query.search : null
                    })
                }).then(res => res.json()).then((result) => {
                    return {
                        items: result.items,
                        total: result.total
                    }
                })

            },

        ]
    },

    {
        path: "/account/galleries",
        exact: true,
        loginNeeded: true,
        preAuthComponent: LoginPage,
        component: GalleriesPage,
        generateSeoTags: (data) => {
            return {
                title: 'Korisnici',
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                let authToken = null;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                } else {
                    return;
                }

                return fetchFunction(`${API_ENDPOINT}/user/gallery`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        page: query.page ? query.page : 0,
                        search: query.search ? query.search : null
                    })
                }).then(res => res.json()).then((result) => {
                    return {
                        items: result.items,
                        total: result.total
                    }
                })

            },

        ]
    },


    {
        path: "/cart",
        exact: true,
        component: CartPage,
        generateSeoTags: (data) => {
            return {
                title: 'Korpa',
            }
        },

        loadData: [

            (fetchFunction, match, pathname, query) => {
                let authToken, cart;
                if (typeof localStorage !== 'undefined') {
                    authToken = 'Bearer ' + localStorage.getItem('authToken');
                    cart = localStorage.getItem('cart');
                    if (!cart) {
                        cart = [];
                    } else {
                        cart = JSON.parse(cart);
                    }
                }

                return fetchFunction(`${API_ENDPOINT}/cart`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({cart})
                }).then(res => res.json()).then((result) => {

                    return {
                        cart: result,
                    }
                })
            },


        ]
    }, {
        path: "/login",
        exact: true,
        redirectUser: '/account/orders',
        component: LoginPage,
        generateSeoTags: (data) => {
            return {
                title: 'Login',
            }
        },

        loadData: []
    }, {
        path: "/account/verify/:uid/:emailVerificationCode",
        exact: true,
        redirectUser: '/account/orders',
        component: EmailVerifyPage,
        generateSeoTags: (data) => {
            return {
                title: 'Email verifikacija',
            }
        },

        loadData: []
    }, {
        path: "/register",
        exact: true,
        redirectUser: '/account/orders',
        generateSeoTags: (data) => {
            return {
                title: 'Registracija',
            }
        },

        component: RegisterPage,
        loadData: []
    }, {
        path: "/reset-password",
        exact: true,
        redirectUser: '/account/orders',
        generateSeoTags: (data) => {
            return {
                title: 'Resetuj lozinku',
            }
        },

        component: ResetPasswordPage,
        loadData: []
    }, {
        path: "/reset-password/:uid/:resetPasswordVerificationCode",
        exact: true,
        redirectUser: '/account/orders',
        generateSeoTags: (data) => {
            return {
                title: 'Reset lozinke',
            }
        },

        component: ChangePasswordPage,
        loadData: []
    }, {
        path: "/blog",
        exact: true,
        component: BlogPage,
        generateSeoTags: (data) => {
            return {
                title: 'Blog',
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                return fetchFunction(`${API_ENDPOINT}/blog/categories`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        categories: result,
                    }
                })

            },
            (fetchFunction, match, pathname, query) => {
                if (!query.page) {
                    query.page = 0;
                }

                return fetchFunction(`${API_ENDPOINT}/blog/fetch/${query.page}/14/null`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        items: result.items,
                        total: result.total
                    }
                })

            },

        ]
    }, {
        path: "/blog/:alias",
        exact: true,
        component: BlogDetailPage,
        generateSeoTags: (data) => {
            return {
                title: (data.data && data.data.title) + ' | Blog',
                description: data.storeData && data.storeData.aboutUs,
                'og:image': data.storeData && data.storeData.profilePhoto
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query) => {
                return fetchFunction(`${API_ENDPOINT}/blog/categories`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        categories: result,
                    }
                })

            },

            (fetchFunction, match, pathname, query) => {
                return fetchFunction(`${API_ENDPOINT}/blog/detail/${match.params.alias}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        data: result,
                    }
                })

            },
            (fetchFunction, match, pathname, query) => {
                return fetchFunction(`${API_ENDPOINT}/blog/fetch/0/3/${match.params.category}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        similar: result.items,
                    }
                })

            },


        ]
    }, {
        path: "/contact",
        exact: true,
        component: ContactPage,
        generateSeoTags: (data) => {
            return {
                title: 'Otvorite Web Shop'
            }
        },

        loadData: []
    }, {
        path: "/page/:alias",
        exact: true,
        component: DynamicPage,
        generateSeoTags: (data) => {
            return {
                title: 'Stranica'
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                return fetchFunction(`${API_ENDPOINT}/page/${match.params.alias}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        data: result,
                    }
                })

            },


        ]
    }, {
        path: "/najave/:id",
        exact: true,
        component: AnnoucmentPage,
        generateSeoTags: (data) => {
            return {
                title: 'Najave'
            }
        },

        loadData: [
            (fetchFunction, match, pathname, query, lang) => {
                return fetchFunction(`${API_ENDPOINT}/announcements/get/${match.params.id}`, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    },
                }).then(res => res.json()).then((result) => {

                    return {
                        data: result,
                    }
                })

            },


        ]
    },
    {
        path: "/404",
        exact: true,
        component: ErrorPage,
        generateSeoTags: (data) => {
            return {
                title: '404'
            }
        },

        loadData: []
    }
]