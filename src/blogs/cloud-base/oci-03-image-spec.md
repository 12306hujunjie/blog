# OCI Image 规范详解 - 容器镜像格式与构建

> **系列导航：** [OCI 容器技术完全指南系列](./oci-series-index.md) → 第三篇：镜像规范  
> **规范版本：** OCI Image Spec v1.0.2  
> **参考仓库：** [opencontainers/image-spec](https://github.com/opencontainers/image-spec)  
> **最后更新：** 2024-07-10

## 概述

OCI Image Specification 定义了容器镜像的标准格式和元数据规范，确保镜像在不同平台和工具间的互操作性。本文将深入解析镜像格式、层级结构、多架构支持等核心概念，帮助您掌握容器镜像的构建和管理。

## 镜像基础概念

### 镜像组成

OCI 镜像由以下核心组件构成：

```
OCI 镜像
├── 镜像清单 (Image Manifest)     # 描述镜像内容的 JSON 文档
├── 镜像配置 (Image Config)       # 包含镜像元数据和运行时配置
└── 镜像层 (Image Layers)        # 文件系统变更的 tar 归档
```

### 内容寻址存储

OCI 镜像使用内容寻址存储，每个组件通过其内容的加密哈希值进行唯一标识：

```json
{
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "size": 1234,
    "digest": "sha256:a9561eb1b190625c9adb5a9513e72c4dedafc1cb2d4c5236c9a6957ec7dfd5a9"
}
```

## 镜像清单 (Image Manifest)

镜像清单是描述镜像结构的 JSON 文档，定义了镜像的所有组件：

```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": {
        "mediaType": "application/vnd.oci.image.config.v1+json",
        "size": 1234,
        "digest": "sha256:config-hash"
    },
    "layers": [
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "size": 5678,
            "digest": "sha256:layer1-hash"
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "size": 9012,
            "digest": "sha256:layer2-hash"
        }
    ],
    "annotations": {
        "org.opencontainers.image.created": "2024-07-10T10:00:00Z",
        "org.opencontainers.image.authors": "OCI Community"
    }
}
```

### 清单字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `schemaVersion` | integer | 是 | 清单格式版本，当前为 2 |
| `mediaType` | string | 否 | 清单的媒体类型 |
| `config` | object | 是 | 镜像配置对象的描述符 |
| `layers` | array | 是 | 镜像层的描述符数组 |
| `annotations` | object | 否 | 任意元数据键值对 |

## 镜像配置对象

镜像配置包含镜像的元数据和默认运行时配置：

```json
{
    "created": "2024-07-10T10:00:00Z",
    "author": "OCI Community",
    "architecture": "amd64",
    "os": "linux",
    "config": {
        "User": "1000:1000",
        "Env": [
            "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "CONTAINER=oci"
        ],
        "Entrypoint": ["/bin/my-app"],
        "Cmd": ["--config", "/etc/app.conf"],
        "WorkingDir": "/app",
        "StopSignal": "SIGTERM",
        "ExposedPorts": {
            "80/tcp": {},
            "443/tcp": {}
        }
    },
    "rootfs": {
        "type": "layers",
        "diff_ids": [
            "sha256:layer1-diff-id",
            "sha256:layer2-diff-id"
        ]
    },
    "history": [
        {
            "created": "2024-07-10T09:00:00Z",
            "created_by": "FROM ubuntu:20.04",
            "empty_layer": false
        },
        {
            "created": "2024-07-10T09:30:00Z",
            "created_by": "COPY app /bin/my-app",
            "empty_layer": false
        }
    ]
}
```

### 运行时配置

镜像配置中的运行时参数将作为容器的默认配置：

| 字段 | 说明 | 示例 |
|------|------|------|
| `User` | 默认用户 | `"1000:1000"` |
| `Env` | 环境变量 | `["PATH=/usr/bin"]` |
| `Entrypoint` | 入口点命令 | `["/bin/sh"]` |
| `Cmd` | 默认参数 | `["-c", "echo hello"]` |
| `WorkingDir` | 工作目录 | `"/app"` |
| `StopSignal` | 停止信号 | `"SIGTERM"` |

### 平台信息

```json
{
    "architecture": "amd64",
    "os": "linux",
    "variant": "v8"
}
```

**支持的 Linux 架构：**
- `amd64` (x86_64)
- `arm64` (aarch64) 
- `arm` (v6, v7, v8)
- `ppc64le` (PowerPC 64-bit Little Endian)
- `riscv64` (RISC-V 64-bit)
- `s390x` (IBM System z)

## 镜像层格式

### 媒体类型

OCI 支持多种层格式：

- `application/vnd.oci.image.layer.v1.tar` - 未压缩 tar 归档
- `application/vnd.oci.image.layer.v1.tar+gzip` - Gzip 压缩层
- `application/vnd.oci.image.layer.v1.tar+zstd` - Zstd 压缩层

### Layer DiffID 和 ChainID

**DiffID：** 层内容的未压缩哈希值
```
DiffID = SHA256(uncompressed_layer_content)
```

**ChainID：** 层级应用后的复合哈希值
```
ChainID(L₀) = DiffID(L₀)
ChainID(L₀|...|Lₙ) = SHA256(ChainID(L₀|...|Lₙ₋₁) + " " + DiffID(Lₙ))
```

### Linux 文件系统特性

#### Whiteout 文件

用于在联合文件系统中表示文件删除：

```bash
# 删除文件
.wh.filename

# 删除目录 (不透明 whiteout)
.wh..wh..opq
```

#### 文件属性支持

- **权限位**: 标准 POSIX 权限
- **所有权**: uid/gid 信息
- **扩展属性**: Linux xattrs
- **硬链接**: POSIX 硬链接支持

## 多架构支持

### 镜像索引

镜像索引允许单一名称指向多个平台的镜像：

```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.index.v1+json",
    "manifests": [
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 1234,
            "digest": "sha256:amd64-manifest",
            "platform": {
                "architecture": "amd64",
                "os": "linux"
            }
        },
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 5678,
            "digest": "sha256:arm64-manifest",
            "platform": {
                "architecture": "arm64",
                "os": "linux",
                "variant": "v8"
            }
        }
    ],
    "annotations": {
        "org.opencontainers.image.ref.name": "myapp:latest"
    }
}
```

### 构建多架构镜像

```bash
# 使用 Docker Buildx
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .

# 使用 Podman
podman manifest create myapp:latest
podman build --platform linux/amd64 -t myapp:amd64 .
podman build --platform linux/arm64 -t myapp:arm64 .
podman manifest add myapp:latest myapp:amd64
podman manifest add myapp:latest myapp:arm64
```

## 镜像构建最佳实践

### Dockerfile 优化

#### 层级优化

```dockerfile
# 不推荐：每个 RUN 创建一个层
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean

# 推荐：合并相关操作
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

#### 多阶段构建

```dockerfile
# 构建阶段
FROM golang:1.19 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

# 运行阶段
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/myapp /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/myapp"]
```

#### .dockerignore 文件

```
# .dockerignore
.git
*.md
Dockerfile
.dockerignore
node_modules
*.log
```

### 安全最佳实践

#### 最小化基础镜像

```dockerfile
# 使用 distroless 镜像
FROM gcr.io/distroless/static-debian11

# 或使用 Alpine Linux
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
```

#### 非 root 用户

```dockerfile
# 创建非特权用户
RUN adduser -D -s /bin/sh appuser
USER appuser

# 或使用数字 UID
USER 1000:1000
```

#### 漏洞扫描

```bash
# 使用 Trivy 扫描
trivy image myapp:latest

# 使用 Grype 扫描
grype myapp:latest
```

### 性能优化

#### 层缓存策略

```dockerfile
# 将变化频率低的内容放在前面
COPY requirements.txt .
RUN pip install -r requirements.txt

# 将变化频率高的内容放在后面
COPY src/ ./src/
```

#### 压缩算法选择

```bash
# 使用 zstd 压缩（更快的解压）
docker build --compress=zstd -t myapp:latest .

# 对比不同压缩算法
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 工具和生态系统

### 镜像构建工具

- **Docker**: 最流行的容器构建工具
- **Podman**: 无守护进程的容器工具
- **Buildah**: 专注于镜像构建的工具
- **Kaniko**: Kubernetes 原生构建工具

### 镜像分析工具

```bash
# 使用 dive 分析镜像层
dive myapp:latest

# 使用 skopeo 检查镜像
skopeo inspect docker://myapp:latest

# 使用 umoci 操作 OCI 镜像
umoci unpack --image myapp:latest bundle
```

### CI/CD 集成

#### GitHub Actions 示例

```yaml
name: Build and Push Image
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: myregistry/myapp:latest
```

## 镜像标注规范

### 预定义标注

OCI 定义了一系列标准标注键：

```json
{
    "annotations": {
        "org.opencontainers.image.created": "2024-07-10T10:00:00Z",
        "org.opencontainers.image.authors": "OCI Community",
        "org.opencontainers.image.url": "https://github.com/myorg/myapp",
        "org.opencontainers.image.documentation": "https://docs.myapp.com",
        "org.opencontainers.image.source": "https://github.com/myorg/myapp",
        "org.opencontainers.image.version": "1.0.0",
        "org.opencontainers.image.revision": "abc123",
        "org.opencontainers.image.vendor": "My Organization",
        "org.opencontainers.image.licenses": "Apache-2.0",
        "org.opencontainers.image.title": "My Application",
        "org.opencontainers.image.description": "A sample OCI image"
    }
}
```

### 自定义标注

```dockerfile
LABEL org.mycompany.team="platform"
LABEL org.mycompany.build-date="2024-07-10"
LABEL org.mycompany.environment="production"
```

## 下一步学习

完成 Image 规范学习后，建议继续学习：

1. **[OCI Distribution 规范详解](./oci-04-distribution-spec.md)** - 了解镜像分发协议
2. **[OCI 容器安全配置实战](./oci-05-security-guide.md)** - 学习镜像安全实践
3. **[OCI 容器生产环境实践案例](./oci-07-production-guide.md)** - 掌握生产环境应用

## 总结

OCI Image 规范为容器镜像提供了标准化的格式定义，通过层级化存储、内容寻址、多架构支持等特性，确保了镜像的可移植性和互操作性。掌握镜像规范对于构建高效、安全的容器化应用至关重要。

**关键要点：**
- 镜像采用内容寻址存储确保完整性
- 层级化结构支持增量更新和缓存
- 多架构支持实现跨平台部署
- 标注机制提供丰富的元数据支持

---

**上一篇：** [OCI Runtime 规范详解 - Linux 容器配置完全指南](./oci-02-runtime-spec.md)  
**下一篇：** [OCI Distribution 规范详解 - 容器镜像分发协议](./oci-04-distribution-spec.md)  
**返回：** [OCI 容器技术完全指南系列](./oci-series-index.md)