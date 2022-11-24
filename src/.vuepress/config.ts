
// .vuepress/config.ts

import recoTheme from 'vuepress-theme-reco'
import {defineUserConfig} from "vuepress";
import {googleAnalyticsPlugin} from "@vuepress/plugin-google-analytics";

export default defineUserConfig({
  title: 'database of memory',
  description: 'study anything and life record',
  theme: recoTheme({
    style: '@vuepress-reco/style-default',
    logo: '/logo.png',
    author: "hujunjie",
    authorAvatar: "/avatar.jpeg",
    docsRepo: 'https://github.com/12306hujunjie/blog',
    docsBranch: 'master',
    docsDir: 'src',
    lastUpdatedText: '更新于',
    autoSetBlogCategories: true,         // 自动设置分类
    autoAddCategoryToNavbar: true,  // 自动将首页、分类和标签添加至头部导航条
    catalogTitle: '目录',
    commentConfig: {
      type: 'valine',
      options: {
        "appId": "9dl7DeiOQ2DmQoIcai3UC6dR-gzGzoHsz",
        "appKey": "kisH4g4RCIHn0064CXERJktf",
        placeholder: 'Leave a comment',
        // verify: true, // 验证码服务
        // notify: true,
        // recordIP: true,
        // hideComments: true // 隐藏评论
        visitor: false,
        recordIp: true
      },
    },
    // series 为原 sidebar
    series: {
      '/docs/theme-reco/': [
        {
          text: 'module one',
          children: ['home', 'theme']
        },
        {
          text: 'module two',
          children: ['api', 'plugin']
        }
      ]
    },

    navbar:
        [
          // { text: 'Home', link: '/' },
          // { text: 'Categories', link: '/blogs/',children: [
          //     {text: "算法", link: '/blogs/algorithm'},
          //   ]},
          // { text: 'Tags', link: '/tags/tag1/1/' },
          { text: 'Docs',
            children: [
              { text: 'vuepress-reco', link: '/docs/theme-reco/theme' },
              { text: 'vuepress-theme-reco', link: '/blogs/other/guide' }
            ]
          },
        ],
  }),
  plugins: [
      googleAnalyticsPlugin({
        id: "G-6XKXLWGWV7"
      })
  ]
  // debug: true,
})
