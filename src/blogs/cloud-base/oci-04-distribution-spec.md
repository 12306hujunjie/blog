---
title: OCI Distribution 规范详解 - 容器镜像分发协议
date: 2024-02-04
tags:
 - OCI
 - 云原生
 - 分发规范
categories:
 - 云原生
sidebar: auto
---

# OCI Distribution 规范详解 - 容器镜像分发协议

> **系列导航：** [OCI 容器技术完全指南系列](./oci-series-index.md) → 第四篇：分发规范  
> **规范版本：** OCI Distribution Spec v1.0.1  
> **参考仓库：** [opencontainers/distribution-spec](https://github.com/opencontainers/distribution-spec)  
> **最后更新：** 2024-07-10

## 概述

OCI Distribution Specification 定义了容器镜像分发和存储的 API 标准，规范了镜像在注册表（Registry）中的存储、检索和管理方式。本文将深入解析分发协议的核心概念、API 接口设计和实际应用场景。

## 分发规范基础

### 核心概念

**Registry（注册表）：** 实现 OCI Distribution API 的服务，负责存储和分发容器镜像

**Repository（仓库）：** 注册表中的一个命名空间，包含相关的镜像清单、blob 和标签

**Blob（二进制大对象）：** 存储在注册表中的不可变内容，通过内容摘要寻址

**Manifest（清单）：** 描述镜像结构的 JSON 文档

**Tag（标签）：** 指向特定清单的可变指针

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    OCI Distribution 架构                     │
├─────────────────────────────────────────────────────────────┤
│  客户端 (Docker, Podman, containerd...)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   Push API      │ │   Pull API      │ │  Discovery API  │ │
│  │                 │ │                 │ │                 │ │
│  │ • 分块上传      │ │ • 内容检索      │ │ • 标签列表      │ │
│  │ • 清单上传      │ │ • 清单下载      │ │ • 内容发现      │ │
│  │ • 跨仓库挂载    │ │ • Blob 下载     │ │ • 版本协商      │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   认证授权      │ │   内容管理      │ │   API 扩展      │ │
│  │                 │ │                 │ │                 │ │
│  │ • Bearer Token  │ │ • 垃圾回收      │ │ • Referrers API │ │
│  │ • Basic Auth    │ │ • 重复数据删除  │ │ • 工件支持      │ │
│  │ • OAuth2        │ │ • 存储后端      │ │ • 自定义扩展    │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  存储后端 (文件系统、对象存储、数据库...)                    │
└─────────────────────────────────────────────────────────────┘
```

## 注册表 API 接口

### 版本协商

所有兼容的注册表必须实现版本端点：

```http
GET /v2/
```

**响应示例：**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "what": "OCI Distribution Spec",
    "version": "1.0.1"
}
```

### 核心端点

#### 1. 内容发现

**列出仓库：**
```http
GET /v2/_catalog?n=<page_size>&last=<last_repository>
```

**列出标签：**
```http
GET /v2/<repository>/tags/list?n=<page_size>&last=<last_tag>
```

**响应示例：**
```json
{
    "name": "myapp",
    "tags": ["latest", "v1.0.0", "v1.1.0"]
}
```

#### 2. 内容检索

**获取清单：**
```http
GET /v2/<repository>/manifests/<reference>
Accept: application/vnd.oci.image.manifest.v1+json
```

**获取 Blob：**
```http
GET /v2/<repository>/blobs/<digest>
```

**检查 Blob 存在性：**
```http
HEAD /v2/<repository>/blobs/<digest>
```

#### 3. 内容推送

**启动 Blob 上传：**
```http
POST /v2/<repository>/blobs/uploads/
Content-Length: 0
```

**响应：**
```http
HTTP/1.1 202 Accepted
Location: /v2/<repository>/blobs/uploads/<uuid>
Range: 0-0
Content-Length: 0
Docker-Upload-UUID: <uuid>
```

**分块上传 Blob：**
```http
PATCH /v2/<repository>/blobs/uploads/<uuid>
Content-Type: application/octet-stream
Content-Length: <chunk_size>
Content-Range: <start>-<end>

<binary_data>
```

**完成 Blob 上传：**
```http
PUT /v2/<repository>/blobs/uploads/<uuid>?digest=<digest>
Content-Length: <remaining_size>
Content-Type: application/octet-stream

<final_chunk>
```

**上传清单：**
```http
PUT /v2/<repository>/manifests/<reference>
Content-Type: application/vnd.oci.image.manifest.v1+json

{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": { ... },
    "layers": [ ... ]
}
```

### 错误处理

#### 标准错误代码

| 错误代码 | HTTP 状态 | 说明 |
|---------|-----------|------|
| `BLOB_UNKNOWN` | 404 | Blob 不存在 |
| `BLOB_UPLOAD_INVALID` | 400 | 上传参数无效 |
| `BLOB_UPLOAD_UNKNOWN` | 404 | 上传会话不存在 |
| `DIGEST_INVALID` | 400 | 摘要格式无效 |
| `MANIFEST_BLOB_UNKNOWN` | 404 | 清单引用的 Blob 不存在 |
| `MANIFEST_INVALID` | 400 | 清单格式无效 |
| `MANIFEST_UNKNOWN` | 404 | 清单不存在 |
| `NAME_INVALID` | 400 | 仓库名称无效 |
| `NAME_UNKNOWN` | 404 | 仓库不存在 |
| `SIZE_INVALID` | 400 | 内容大小无效 |
| `TAG_INVALID` | 400 | 标签名称无效 |
| `UNAUTHORIZED` | 401 | 认证失败 |
| `DENIED` | 403 | 权限不足 |
| `UNSUPPORTED` | 405 | 操作不支持 |

#### 错误响应格式

```json
{
    "errors": [
        {
            "code": "BLOB_UNKNOWN",
            "message": "blob unknown to registry",
            "detail": {
                "digest": "sha256:abc123..."
            }
        }
    ]
}
```

## 认证和授权

### Bearer Token 认证

#### 认证流程

1. **客户端请求受保护资源**
```http
GET /v2/private-repo/manifests/latest
```

2. **注册表返回认证挑战**
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="https://auth.example.com/token",
                         service="registry.example.com",
                         scope="repository:private-repo:pull"
```

3. **客户端向认证服务器请求 Token**
```http
GET https://auth.example.com/token?service=registry.example.com&scope=repository:private-repo:pull
Authorization: Basic <base64(username:password)>
```

4. **认证服务器返回 Token**
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
    "expires_in": 3600,
    "issued_at": "2024-07-10T10:00:00Z"
}
```

5. **客户端使用 Token 访问资源**
```http
GET /v2/private-repo/manifests/latest
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...
```

### 权限范围

#### 作用域格式

```
repository:<repository>:<action>
```

**支持的动作：**
- `pull` - 下载权限
- `push` - 上传权限
- `delete` - 删除权限
- `*` - 所有权限

**示例：**
```
repository:myapp/backend:pull,push
repository:myapp/*:pull
registry:catalog:*
```

### Basic 认证

简单的用户名密码认证：

```http
GET /v2/private-repo/manifests/latest
Authorization: Basic <base64(username:password)>
```

## 内容分发协议

### 推送工作流

#### 1. 分块上传（推荐）

适用于大文件和不稳定网络环境：

```bash
#!/bin/bash
# chunked-upload.sh

REPO="example.com/myapp"
FILE="layer.tar.gz"
CHUNK_SIZE=1048576  # 1MB chunks

# 1. 启动上传会话
UPLOAD_URL=$(curl -X POST \
  "https://registry.example.com/v2/${REPO}/blobs/uploads/" \
  -H "Authorization: Bearer $TOKEN" \
  -I | grep -i location | cut -d' ' -f2)

# 2. 分块上传
FILESIZE=$(wc -c < "$FILE")
OFFSET=0

while [ $OFFSET -lt $FILESIZE ]; do
    END=$((OFFSET + CHUNK_SIZE - 1))
    if [ $END -ge $FILESIZE ]; then
        END=$((FILESIZE - 1))
    fi
    
    dd if="$FILE" bs=1 skip=$OFFSET count=$((END - OFFSET + 1)) 2>/dev/null | \
    curl -X PATCH \
        "$UPLOAD_URL" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/octet-stream" \
        -H "Content-Range: $OFFSET-$END" \
        --data-binary @-
    
    OFFSET=$((END + 1))
done

# 3. 完成上传
DIGEST=$(sha256sum "$FILE" | cut -d' ' -f1)
curl -X PUT \
    "$UPLOAD_URL?digest=sha256:$DIGEST" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Length: 0"
```

#### 2. 单体上传

适用于小文件：

```bash
#!/bin/bash
# single-upload.sh

REPO="example.com/myapp"
FILE="config.json"
DIGEST=$(sha256sum "$FILE" | cut -d' ' -f1)

curl -X POST \
    "https://registry.example.com/v2/${REPO}/blobs/uploads/?digest=sha256:$DIGEST" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$FILE"
```

#### 3. 跨仓库挂载

复用已存在的 Blob：

```bash
curl -X POST \
    "https://registry.example.com/v2/target-repo/blobs/uploads/?mount=sha256:$DIGEST&from=source-repo" \
    -H "Authorization: Bearer $TOKEN"
```

### 拉取优化

#### 范围请求

支持部分内容下载：

```http
GET /v2/myapp/blobs/sha256:abc123...
Range: bytes=1024-2048
```

#### 内容验证

```bash
#!/bin/bash
# verify-content.sh

EXPECTED_DIGEST="sha256:abc123..."
ACTUAL_DIGEST=$(curl -L "https://registry.example.com/v2/myapp/blobs/$EXPECTED_DIGEST" | sha256sum | cut -d' ' -f1)

if [ "sha256:$ACTUAL_DIGEST" = "$EXPECTED_DIGEST" ]; then
    echo "Content verified successfully"
else
    echo "Content verification failed"
    exit 1
fi
```

## Referrers API 和工件支持

### Referrers API

用于查找引用特定清单的工件：

```http
GET /v2/<repository>/referrers/<digest>?artifactType=<type>
```

**响应示例：**
```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.index.v1+json",
    "manifests": [
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 1234,
            "digest": "sha256:signature-manifest",
            "artifactType": "application/vnd.example.signature.v1+json"
        },
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "size": 5678,
            "digest": "sha256:sbom-manifest",
            "artifactType": "application/vnd.example.sbom.v1+json"
        }
    ]
}
```

### 工件清单

用于存储非容器镜像的工件：

```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "artifactType": "application/vnd.example.signature.v1+json",
    "config": {
        "mediaType": "application/vnd.oci.empty.v1+json",
        "size": 2,
        "digest": "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a"
    },
    "layers": [
        {
            "mediaType": "application/vnd.example.signature.v1+tar",
            "size": 1024,
            "digest": "sha256:signature-layer"
        }
    ],
    "subject": {
        "mediaType": "application/vnd.oci.image.manifest.v1+json",
        "size": 7682,
        "digest": "sha256:target-image-manifest"
    },
    "annotations": {
        "org.example.signature.key": "key1"
    }
}
```

## 注册表实现

### 开源注册表

#### Harbor

企业级云原生工件注册表：

```yaml
# harbor-values.yaml
expose:
  type: loadBalancer
  loadBalancer:
    IP: "192.168.1.100"

persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      storageClass: "fast-ssd"
      size: 200Gi
    database:
      storageClass: "fast-ssd"  
      size: 10Gi

trivy:
  enabled: true

notary:
  enabled: true

chartmuseum:
  enabled: true
```

#### Distribution (Docker Registry v2)

轻量级 OCI 兼容注册表：

```yaml
# distribution-config.yml
version: 0.1
log:
  fields:
    service: registry
storage:
  cache:
    blobdescriptor: inmemory
  filesystem:
    rootdirectory: /var/lib/registry
  delete:
    enabled: true
http:
  addr: :5000
  headers:
    X-Content-Type-Options: [nosniff]
health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
```

### 云服务注册表

#### Amazon ECR

```bash
# 配置 ECR
aws ecr get-login-password --region us-west-2 | \
docker login --username AWS --password-stdin \
123456789012.dkr.ecr.us-west-2.amazonaws.com

# 推送镜像
docker tag myapp:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/myapp:latest
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/myapp:latest
```

#### Azure Container Registry

```bash
# 配置 ACR
az acr login --name myregistry

# 推送镜像
docker tag myapp:latest myregistry.azurecr.io/myapp:latest
docker push myregistry.azurecr.io/myapp:latest
```

## 性能优化

### 缓存策略

#### 1. 客户端缓存

```bash
# Docker 层缓存配置
{
    "registry-mirrors": ["https://cache.example.com"],
    "max-concurrent-downloads": 6,
    "max-concurrent-uploads": 5
}
```

#### 2. CDN 集成

```nginx
# nginx.conf for registry CDN
upstream registry {
    server registry1.example.com:5000;
    server registry2.example.com:5000;
}

server {
    listen 443 ssl;
    server_name registry.example.com;
    
    location /v2/ {
        proxy_pass http://registry;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存 Blob 内容
        location ~* /v2/.*/blobs/ {
            proxy_cache registry_cache;
            proxy_cache_valid 200 30d;
            proxy_cache_key $uri;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

### 存储优化

#### 重复数据删除

```go
// 基于内容寻址的重复数据删除
type BlobStore struct {
    storage map[string][]byte
    refs    map[string]int
}

func (bs *BlobStore) Put(digest string, data []byte) error {
    if _, exists := bs.storage[digest]; !exists {
        bs.storage[digest] = data
        bs.refs[digest] = 0
    }
    bs.refs[digest]++
    return nil
}

func (bs *BlobStore) Delete(digest string) error {
    bs.refs[digest]--
    if bs.refs[digest] <= 0 {
        delete(bs.storage, digest)
        delete(bs.refs, digest)
    }
    return nil
}
```

#### 垃圾回收

```bash
#!/bin/bash
# registry-gc.sh

# 标记阶段：标记所有被引用的 Blob
registry garbage-collect --dry-run /etc/registry/config.yml

# 清理阶段：删除未被引用的 Blob
registry garbage-collect /etc/registry/config.yml

# 压缩存储空间
find /var/lib/registry -name "*.tmp" -delete
```

## 监控和运维

### 指标监控

```yaml
# prometheus-config.yml
scrape_configs:
  - job_name: 'registry'
    static_configs:
      - targets: ['registry:5000']
    metrics_path: /metrics
    scrape_interval: 30s
```

### 健康检查

```bash
#!/bin/bash
# registry-health-check.sh

# 检查 API 可用性
if curl -f -s "https://registry.example.com/v2/" > /dev/null; then
    echo "Registry API is healthy"
else
    echo "Registry API is unhealthy"
    exit 1
fi

# 检查存储空间
USAGE=$(df /var/lib/registry | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 90 ]; then
    echo "Storage usage is critical: ${USAGE}%"
    exit 1
fi

# 检查上传性能
UPLOAD_TIME=$(time (echo "test" | curl -X POST \
    "https://registry.example.com/v2/test/blobs/uploads/" \
    --data-binary @- 2>/dev/null) 2>&1 | grep real | awk '{print $2}')

echo "Upload test completed in $UPLOAD_TIME"
```

## 下一步学习

完成 Distribution 规范学习后，建议继续学习：

1. **[OCI 容器安全配置实战](./oci-05-security-guide.md)** - 了解注册表安全配置
2. **[OCI 容器监控调试与故障排除](./oci-06-monitoring-guide.md)** - 学习分发系统监控
3. **[OCI 容器生产环境实践案例](./oci-07-production-guide.md)** - 掌握企业级注册表部署

## 总结

OCI Distribution 规范为容器镜像的分发提供了标准化的 API 接口，通过统一的协议确保了不同注册表实现之间的互操作性。理解分发规范对于构建可靠的容器基础设施至关重要。

**关键要点：**
- Distribution API 提供了完整的镜像分发协议
- 支持分块上传、断点续传等高级特性
- 认证授权机制保证了访问安全
- Referrers API 扩展了工件生态支持

---

**上一篇：** [OCI Image 规范详解 - 容器镜像格式与构建](./oci-03-image-spec.md)  
**下一篇：** [OCI 容器安全配置实战](./oci-05-security-guide.md)  
**返回：** [OCI 容器技术完全指南系列](./oci-series-index.md)