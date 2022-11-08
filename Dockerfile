FROM nginx:alpine

COPY nginx.conf /etc/nginx/
COPY src/.vuepress/dist /usr/local/my_blog/

ENTRYPOINT ["nginx", "-g", "daemon off;"]