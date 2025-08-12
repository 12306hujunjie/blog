---
title: runc 概述与架构
date: 2025-08-01
tags:
 - runc
 - 云原生
 - 架构设计
categories:
 - 云原生
sidebar: auto
---

# runc 概述与架构

> **系列导航：** [runc 容器运行时深度解析系列](./README.md) → 第一篇：概述与架构  
> **最后更新：** 2024

## 概述

runc 是一个轻量级的容器运行时，专注于根据 OCI (Open Container Initiative) 规范创建和运行容器。作为容器生态系统的基础组件，runc 为 Docker、containerd、Podman 等上层工具提供了标准化的容器执行环境。

## 定义与特征

```bash
# runc 的基本使用示例
$ runc --help
NAME:
   runc - Open Container Initiative runtime

USAGE:
   runc [global options] command [command options] [arguments...]
```

**核心特征：**
- **低层工具** - 不面向终端用户，主要被其他容器引擎调用
- **标准兼容** - 实现 OCI Runtime Specification 
- **Linux 专用** - 仅支持 Linux 系统
- **基础组件** - 被 Docker、containerd、Podman 等高层工具使用

## 解决的问题

在 runc 出现之前，容器运行时功能通常与容器引擎紧耦合。runc 的出现解决了：

1. **标准化问题**: 提供统一的容器运行时接口
2. **解耦问题**: 将容器运行与镜像管理、网络管理分离  
3. **安全问题**: 提供安全的容器隔离机制
4. **兼容性问题**: 确保不同容器工具的互操作性

## 2. 容器技术栈中的位置

### 2.1 容器技术栈架构

```
┌─────────────────────────────────────────────┐
│  用户接口层                                  │
│  docker, podman, kubectl                   │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  容器引擎层                                  │
│  Docker Daemon, Podman, containerd         │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  高层运行时                                  │
│  containerd, CRI-O                         │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐ ← runc 在这里
│  低层运行时                                  │
│  runc, gVisor, Kata Containers             │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Linux 内核                                 │
│  Namespaces, Cgroups, Capabilities         │
└─────────────────────────────────────────────┘
```

### 2.2 职责分工

| 层级 | 主要职责 | runc 的角色 |
|------|----------|-------------|
| 用户接口层 | 用户体验、命令行/API | 不直接参与 |
| 容器引擎层 | 镜像管理、网络、存储 | 被调用执行容器 |
| 高层运行时 | 容器生命周期管理 | 被调用处理具体执行 |
| **低层运行时** | **直接与内核交互** | **runc 的核心职责** |
| Linux 内核 | 提供隔离和资源管理 | runc 调用内核功能 |

## 3. OCI 规范与 runc

### 3.1 OCI 规范简介

OCI (Open Container Initiative) 定义了容器运行时和镜像格式的标准：

- **Runtime Specification**: 定义容器的运行时行为
- **Image Specification**: 定义容器镜像格式  
- **Distribution Specification**: 定义镜像分发协议

### 3.2 OCI Bundle 结构

runc 工作的基本单位是 **OCI Bundle**：

```
/container-bundle/
├── config.json          # 容器配置文件 (OCI Runtime Spec)
└── rootfs/              # 容器的根文件系统
    ├── bin/
    ├── etc/
    ├── lib/
    ├── usr/
    └── ...
```

#### config.json 示例

```json
{
  "ociVersion": "1.0.2",
  "process": {
    "args": ["/bin/sh"],
    "cwd": "/",
    "env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"]
  },
  "root": {
    "path": "rootfs"
  },
  "linux": {
    "namespaces": [
      {"type": "pid"},
      {"type": "network"},
      {"type": "mount"},
      {"type": "user"}
    ],
    "resources": {
      "memory": {"limit": 134217728}
    }
  }
}
```

### 3.3 runc 与 OCI 规范的关系

```
OCI Runtime Spec ──────────→ runc 实现
     │                          │
     │ 定义标准                   │ 具体实现
     │                          │
     ▼                          ▼
config.json ──────解析───→ libcontainer.Config
     │                          │
     │                          │ 
     ▼                          ▼
Bundle ──────────运行────→ 实际的容器进程
```

## 4. runc 整体架构

### 4.1 项目结构概览

```
runc/
├── main.go                    # CLI 入口点
├── *.go                      # 各种命令实现 (run.go, create.go 等)
├── libcontainer/             # 核心容器库
│   ├── container.go          # 容器接口定义
│   ├── configs/              # 配置管理
│   ├── process.go            # 进程管理
│   ├── init_linux.go         # 容器初始化
│   ├── nsenter/              # namespace 进入机制
│   └── ...
├── internal/                 # 内部工具函数
└── docs/                     # 文档
```

### 4.2 核心架构层次

```
┌─────────────────────────────────────────────┐
│              CLI 命令层                      │
│  run, create, start, exec, kill, delete    │
└─────────────────┬───────────────────────────┘
                  │ 命令解析与路由
┌─────────────────▼───────────────────────────┐
│            命令处理层                        │
│     startContainer(), setupSpec()          │
└─────────────────┬───────────────────────────┘
                  │ OCI Bundle 处理
┌─────────────────▼───────────────────────────┐
│          libcontainer 核心层                │
│  Container, Process, Config, Factory       │
└─────────────────┬───────────────────────────┘
                  │ 系统调用封装
┌─────────────────▼───────────────────────────┐
│             Linux 内核层                    │
│   Namespaces, Cgroups, Capabilities        │
└─────────────────────────────────────────────┘
```

### 4.3 关键组件详解

#### A. CLI 命令层 (`main.go`)

```go
// main.go 中的关键代码结构
app := cli.NewApp()
app.Name = "runc"
app.Commands = []cli.Command{
    runCommand,        // 运行容器
    createCommand,     // 创建容器  
    startCommand,      // 启动容器
    execCommand,       // 在容器中执行命令
    killCommand,       // 终止容器
    deleteCommand,     // 删除容器
    // ... 更多命令
}
```

**设计特点**：
- 使用 `urfave/cli` 库构建命令行界面
- 每个命令对应一个操作，职责清晰
- 统一的参数解析和错误处理

#### B. libcontainer 核心库

**Container 接口** (`libcontainer/container.go:60`)：

```go
// Container 定义了容器的核心操作接口
type Container interface {
    // 容器状态管理
    ID() string
    State() (*State, error)
    
    // 进程管理
    Run(process *Process) error
    Start(process *Process) error
    Signal(signal os.Signal) error
    
    // 资源管理
    Set(config *configs.Config) error
    Stats() (*Stats, error)
    
    // 生命周期管理
    Destroy() error
}
```

**配置管理** (`libcontainer/configs/config.go`)：

```go
// Config 包含容器的完整配置
type Config struct {
    // 基础信息
    Hostname    string
    Domainname  string
    
    // 进程配置
    Process     *Process
    
    // 资源限制
    Cgroups     *Cgroup
    
    // 命名空间配置
    Namespaces  Namespaces
    
    // 安全配置
    Capabilities     []string
    SeccompConfig    *Seccomp
    
    // 挂载点
    Mounts      []*Mount
}
```

#### C. 进程管理 (`libcontainer/process.go`)

```go
// Process 定义了进程的配置和状态
type Process struct {
    Args         []string           // 命令行参数
    Env          []string           // 环境变量
    Cwd          string             // 工作目录
    User         string             // 用户ID
    
    // I/O 配置
    Stdin        io.Reader
    Stdout       io.Writer
    Stderr       io.Writer
    
    // 进程状态
    Pid          int
    StartTime    time.Time
}
```

## 5. 核心工作流程

### 5.1 容器创建流程

```
用户执行: runc create mycontainer
          │
          ▼
┌─────────────────────────────────────┐
│  1. CLI 解析命令和参数              │
│     main() → createCommand.Action() │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  2. 加载和验证 OCI Bundle           │
│     setupSpec() → 读取 config.json  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. 转换为 libcontainer 配置        │
│     specconv.CreateLibcontainerConfig│
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  4. 创建容器实例                    │
│     libcontainer.Create()           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  5. 初始化进程准备                  │
│     container.Start() → fork()      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  6. 设置隔离环境                    │
│     namespaces, cgroups, security   │
└─────────────────────────────────────┘
```

### 5.2 代码执行路径

以 `runc create` 命令为例：

1. **入口**: `main.go:main()` → CLI 路由
2. **命令处理**: `create.go:createCommand.Action`
3. **配置处理**: `utils.go:startContainer()` → `setupSpec()`
4. **容器创建**: `libcontainer.Create()`
5. **进程启动**: `container.Start(process)`

```go
// create.go 中的关键代码
var createCommand = cli.Command{
    Name: "create",
    Action: func(context *cli.Context) error {
        // 解析参数
        spec, err := setupSpec(context)
        if err != nil {
            return err
        }
        
        // 创建容器
        return startContainer(context, CT_ACT_CREATE, spec)
    },
}
```

## 6. 与其他容器工具的协作

### 6.1 Docker + runc

```
docker run ubuntu:20.04 /bin/bash
       │
       ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Docker CLI    │───▶│Docker Daemon │───▶│ containerd  │
└─────────────────┘    └──────────────┘    └─────┬───────┘
                                                  │
                       ┌──────────────────────────▼
                       ▼
                  ┌─────────────┐
                  │    runc     │ ← 最终执行容器
                  └─────────────┘
```

**工作分工**：
- **Docker CLI**: 用户界面和命令解析
- **Docker Daemon**: 镜像管理、网络配置、存储管理
- **containerd**: 高层运行时，容器生命周期管理
- **runc**: 低层运行时，直接创建和管理容器进程

### 6.2 containerd + runc

```go
// containerd 调用 runc 的示例
task, err := container.NewTask(ctx, cio.NewCreator(cio.WithStdio))
if err != nil {
    return err
}

// containerd 内部会调用 runc create
// 然后调用 runc start
err = task.Start(ctx)
```

### 6.3 Kubernetes + runc

```
kubectl run pod
      │
      ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  kubelet    │───▶│   CRI-O     │───▶│    runc     │
└─────────────┘    │     或      │    └─────────────┘
                   │ containerd  │
                   └─────────────┘
```

## 7. 实践练习

### 7.1 环境准备

```bash
# 1. 克隆 runc 源码
git clone https://github.com/opencontainers/runc.git
cd runc

# 2. 编译 runc
make

# 3. 验证安装
./runc --version
```

### 7.2 创建简单容器

```bash
# 1. 创建工作目录
mkdir /tmp/mycontainer
cd /tmp/mycontainer

# 2. 创建根文件系统
mkdir rootfs
cd rootfs
# 复制基础文件系统（可以从 Docker 镜像提取）
docker export $(docker create busybox) | tar -C . -xf -

# 3. 生成配置文件
cd ..
runc spec

# 4. 创建容器
runc create mycontainer

# 5. 查看容器状态
runc state mycontainer

# 6. 启动容器
runc start mycontainer
```

### 7.3 代码跟踪练习

**任务**: 跟踪 `runc create` 命令的执行流程

1. 在 `create.go` 的 `Action` 函数中添加日志
2. 在 `utils.go` 的 `startContainer` 函数中添加日志
3. 观察配置文件的加载和转换过程
4. 理解 OCI Bundle 到 libcontainer.Config 的转换

```go
// 在关键位置添加调试信息
fmt.Printf("DEBUG: Loading spec from %s\n", bundle)
fmt.Printf("DEBUG: Container config: %+v\n", config)
```

## 8. 思考题

1. **架构设计**: 为什么 runc 要设计成独立的工具，而不是集成到 Docker 中？

2. **标准兼容**: OCI 规范为容器生态带来了什么好处？

3. **职责分离**: 对比分析容器引擎 (Docker) 和容器运行时 (runc) 的职责差异。

4. **安全考虑**: runc 作为 privileged 进程运行，有什么安全风险？如何缓解？

## 9. 扩展阅读

- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)
- [containerd Architecture](https://containerd.io/docs/getting-started/)
- [runc 官方文档](https://github.com/opencontainers/runc)
- [Linux Containers 原理](https://www.kernel.org/doc/Documentation/cgroup-v1/cgroups.txt)

## 总结

本文介绍了 runc 在容器生态系统中的定位、核心特征、架构设计以及与其他容器工具的协作关系。runc 作为 OCI 规范的参考实现，为容器技术的标准化和互操作性奠定了基础。

**下一篇文章**: [容器生命周期管理](./02-容器生命周期管理.md) - 深入了解容器的创建、运行、暂停、恢复和销毁的完整流程。