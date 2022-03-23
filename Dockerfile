FROM nginx:alpine

COPY nginx.conf /etc/nginx/
COPY public/ /usr/local/my_blog/

ENTRYPOINT ["nginx", "-g", "daemon off;"]