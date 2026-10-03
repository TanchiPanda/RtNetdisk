FROM alpine:latest

WORKDIR /app

# 安装必要工具
RUN apk update && apk add --no-cache tzdata ca-certificates wget \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 下载后端二进制
RUN wget -O /app/cloudreve https://aka.doubaocdn.com/s/HTc7EVRKeJ \
    && chmod +x /app/cloudreve

# 创建数据目录
RUN mkdir -p /app/data /app/uploads /app/avatar

EXPOSE 5212

VOLUME ["/app/data", "/app/uploads", "/app/avatar"]

ENTRYPOINT ["/app/cloudreve"]
