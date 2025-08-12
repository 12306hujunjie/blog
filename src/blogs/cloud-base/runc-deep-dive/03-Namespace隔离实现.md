---
title: Namespace 隔离实现
date: 2025-08-03
tags:
 - runc
 - 云原生
 - Namespace
categories:
 - 云原生
sidebar: auto
---

# Namespace 隔离实现

> **系列导航：** [runc 容器运行时深度解析系列](./README.md) → 第三篇：Namespace 隔离实现  
> **上一篇：** [容器生命周期管理](./02-容器生命周期管理.md)  
> **最后更新：** 2024

## 概述

本文深入分析 runc 如何实现 Linux Namespace 隔离机制，这是容器技术的核心基础之一。通过 Namespace，容器可以拥有独立的进程空间、网络栈、文件系统视图等，实现与宿主机和其他容器的有效隔离。

## 🎯 学习目标

完成本模块后，你将能够：
- 深入理解 Linux Namespace 的 8 种类型和作用机制
- 掌握 runc 中三阶段进程创建模型的设计原理
- 理解 nsenter 的 C 代码实现和系统调用封装
- 掌握 namespace 创建、加入和管理的完整流程
- 具备调试和定制 namespace 隔离功能的能力

## 1. Linux Namespace 基础概念

### 1.1 什么是 Namespace？

**Namespace** 是 Linux 内核提供的一种资源隔离机制，它可以让不同的进程组看到不同的系统视图，实现进程级别的虚拟化。

```
┌─────────────────────────────────────────────────┐
│                物理机器                         │
├─────────────────┬───────────────────────────────┤
│   容器 A        │        容器 B                 │
│                 │                               │
│ PID: 1,2,3      │     PID: 1,2,3               │
│ NET: eth0       │     NET: eth0                │
│ MNT: /app       │     MNT: /data               │
│ UTS: web-01     │     UTS: db-01               │
└─────────────────┴───────────────────────────────┘
       ▲                        ▲
       │        共享内核         │
   namespace A             namespace B
```

**核心特性**：
- 🔒 **隔离性**: 每个 namespace 内的进程只能看到自己的资源
- 🧬 **继承性**: 子进程继承父进程的 namespace
- 🔄 **可加入**: 进程可以加入已存在的 namespace
- 🏗️ **可嵌套**: 某些 namespace 支持嵌套结构

### 1.2 八种 Namespace 类型详解

#### A. PID Namespace (进程ID隔离)

**作用**: 隔离进程 ID 空间，每个 PID namespace 都有自己的 PID 1 (init进程)

```go
// libcontainer/configs/namespaces_linux.go:15
const NEWPID NamespaceType = "NEWPID"
```

**关键特性**：
- 容器内的 PID 1 进程负责回收僵尸进程
- 内外 PID 映射：容器内 PID 1 对应宿主机上某个 PID
- 嵌套支持：可以创建多层 PID namespace

```
宿主机视图:        容器内视图:
PID 1: systemd    PID 1: /bin/bash  ← 容器的 init 进程
PID 1234: runc    PID 2: /app       ← 应用进程
PID 1235: bash    (不可见其他进程)
```

#### B. Network Namespace (网络隔离)

**作用**: 隔离网络设备、IP地址、端口、路由表等网络资源

```go
const NEWNET NamespaceType = "NEWNET"
```

**隔离资源**：
- 网络接口(eth0, lo等)
- IP地址和路由表
- iptables规则
- 网络端口范围
- /proc/net 目录内容

```
┌─────────────────┐    ┌─────────────────┐
│   宿主机网络     │    │   容器网络       │
│                 │    │                 │
│ eth0: 10.0.0.1  │    │ eth0: 172.17.0.2│
│ lo: 127.0.0.1   │    │ lo: 127.0.0.1   │
│ 路由表: 默认     │    │ 路由表: 隔离     │
└─────────────────┘    └─────────────────┘
```

#### C. Mount Namespace (文件系统隔离)

**作用**: 隔离文件系统挂载点，每个 mount namespace 有独立的挂载点列表

```go
const NEWNS NamespaceType = "NEWNS"  // 历史原因，NS是最早的namespace
```

**隔离内容**：
- 挂载点列表(/proc/mounts)
- 根文件系统(/)
- 挂载传播属性(private, shared, slave等)

```
宿主机挂载:              容器内挂载:
/dev/sda1 -> /          /dev/sda2 -> /
/dev/sda2 -> /home      tmpfs -> /tmp
tmpfs -> /tmp           /dev/sda3 -> /data
                        overlay -> /app
```

#### D. User Namespace (用户权限隔离)

**作用**: 隔离用户ID和组ID，实现用户权限映射

```go
const NEWUSER NamespaceType = "NEWUSER"
```

**核心概念**：
- ID 映射：容器内 UID/GID 映射到宿主机的不同 UID/GID
- 权限隔离：容器内的 root 用户不等同于宿主机 root
- 无特权容器：普通用户也可以创建容器

```go
// ID映射配置示例
type IDMap struct {
    ContainerID int64  // 容器内ID: 0 (root)
    HostID      int64  // 宿主机ID: 1000 (普通用户)
    Size        int64  // 映射范围: 65536
}
```

**映射示例**：
```
容器内视图:        宿主机视图:
UID 0 (root)   →  UID 1000 (user)
UID 1 (user)   →  UID 1001 
UID 100        →  UID 1100
...            →  ...
UID 65535      →  UID 66535
```

#### E. IPC Namespace (进程间通信隔离)

**作用**: 隔离 System V IPC 和 POSIX 消息队列

```go
const NEWIPC NamespaceType = "NEWIPC"
```

**隔离资源**：
- System V 消息队列、信号量、共享内存
- POSIX 消息队列
- /proc/sysvipc/ 内容

#### F. UTS Namespace (主机名隔离)

**作用**: 隔离主机名(hostname)和域名(domainname)

```go
const NEWUTS NamespaceType = "NEWUTS"
```

**应用场景**：
- 容器有独立的主机名
- 微服务架构中的服务标识

```bash
# 宿主机
$ hostname
host-machine

# 容器内
$ hostname  
web-server-01
```

#### G. Cgroup Namespace (控制组隔离)

**作用**: 隔离 cgroups 视图，容器内看不到宿主机的完整 cgroups 树

```go
const NEWCGROUP NamespaceType = "NEWCGROUP"
```

**特性**：
- 虚拟化 /proc/cgroups 和 /proc/self/cgroup 内容
- 隐藏宿主机的 cgroups 层次结构

#### H. Time Namespace (时间隔离)

**作用**: 隔离系统时间，容器可以有不同的时间视图

```go
const NEWTIME NamespaceType = "NEWTIME"  // Linux 5.6+ 支持
```

**应用场景**：
- 时间旅行测试
- 不同时区的应用

## 2. runc 的 Namespace 实现架构

### 2.1 核心数据结构

#### Namespace 配置结构

```go
// libcontainer/configs/namespaces_linux.go:55
type Namespace struct {
    Type NamespaceType `json:"type"`         // namespace 类型
    Path string        `json:"path,omitempty"` // 加入现有 namespace 的路径
}

type Namespaces []Namespace

// 检查是否包含特定类型的 namespace
func (n Namespaces) Contains(t NamespaceType) bool {
    for _, ns := range n {
        if ns.Type == t {
            return true
        }
    }
    return false
}
```

#### 系统调用映射

```go
// libcontainer/configs/namespaces_syscall.go:12
var namespaceInfo = map[NamespaceType]int{
    NEWNET:    unix.CLONE_NEWNET,    // 0x40000000
    NEWNS:     unix.CLONE_NEWNS,     // 0x00020000  
    NEWUSER:   unix.CLONE_NEWUSER,   // 0x10000000
    NEWIPC:    unix.CLONE_NEWIPC,    // 0x08000000
    NEWUTS:    unix.CLONE_NEWUTS,    // 0x04000000
    NEWPID:    unix.CLONE_NEWPID,    // 0x20000000
    NEWCGROUP: unix.CLONE_NEWCGROUP, // 0x02000000
    NEWTIME:   unix.CLONE_NEWTIME,   // 0x00000080
}

// 生成 clone 系统调用标志
func (n Namespaces) CloneFlags() uintptr {
    var flag int
    for _, ns := range n {
        if ns.Path != "" {
            continue  // 加入现有 namespace，不需要创建新的
        }
        flag |= namespaceInfo[ns.Type]
    }
    return uintptr(flag)
}
```

### 2.2 三阶段进程创建模型

runc 采用独特的三阶段进程创建模型来处理 namespace 的复杂性：

```
用户调用: runc create mycontainer
│
▼
┌─────────────────────────────────────────────────┐
│  阶段0: 父进程 (STAGE_PARENT)                   │
│  职责: 用户映射设置、进程协调                    │
│  进程: runc 主进程                              │
└─────────────┬───────────────────────────────────┘
              │ fork() + nsenter
              ▼
┌─────────────────────────────────────────────────┐
│  阶段1: 中间子进程 (STAGE_CHILD)                │
│  职责: 加入/创建 namespace、权限处理             │
│  进程: bootstrap 进程                           │
└─────────────┬───────────────────────────────────┘
              │ fork() 
              ▼
┌─────────────────────────────────────────────────┐
│  阶段2: 最终进程 (STAGE_INIT)                   │
│  职责: 容器初始化、执行用户程序                  │
│  进程: 容器的 init 进程                         │
└─────────────────────────────────────────────────┘
```

#### 为什么需要三阶段？

1. **权限处理复杂性**: 用户 namespace 需要先设置映射才能操作其他 namespace
2. **时序依赖**: 某些 namespace 的创建顺序很重要
3. **同步需求**: 父进程需要设置子进程的用户映射
4. **安全考虑**: 最终进程不应该有不必要的权限

### 2.3 nsenter 核心实现

#### C 代码结构

runc 使用 C 代码实现底层 namespace 操作，主要文件：

```
libcontainer/nsenter/
├── nsexec.c          # 主要实现文件
├── namespace.h       # 命名空间常量定义  
├── log.c/log.h       # 日志记录
└── nsenter.go        # Go 与 C 的接口
```

#### 主入口函数

```c
// libcontainer/nsenter/nsexec.c:638
void nsexec(void)
{
    int pipenum;
    struct nlconfig_t config = { 0 };
    
    // 1. 解析配置和同步管道
    pipenum = initpipe();
    if (pipenum == -1) return;
    
    // 2. 从管道读取配置信息
    if (nlconfig_parse(pipenum, &config) < 0)
        bail("failed to parse netlink config");
    
    // 3. 根据阶段执行不同逻辑
    switch (config.stage) {
    case STAGE_PARENT:  
        parent_stage(&config);
        break;
    case STAGE_CHILD:   
        child_stage(&config);
        break;
    case STAGE_INIT:    
        init_stage(&config);
        break;
    }
}
```

#### 配置结构体

```c
// libcontainer/nsenter/nsexec.c:89
struct nlconfig_t {
    char *data;                    // 序列化数据
    int stage;                     // 当前阶段
    
    // namespace 相关
    char *namespaces;              // 要加入的 namespace 路径
    size_t namespaces_len;         // 长度
    
    // clone 标志
    uint32_t cloneflags;           // clone() 系统调用标志
    
    // 用户映射
    char *uidmap, *gidmap;         // ID 映射数据
    char *uidmappath, *gidmappath; // 映射文件路径
    int uidmap_len, gidmap_len;    // 映射数据长度
    
    // 其他配置
    char *oom_score_adj;           // OOM 分数调整
    char *rootfs;                  // 根文件系统路径
    bool is_rootless_euid;         // 是否为 rootless 模式
    bool is_setgroup;              // 是否可以调用 setgroups
    bool no_new_keyring;           // 是否禁用新 keyring
    
    // 时间 namespace 偏移
    char *time_offsets;            // 时间偏移配置
    int time_offsets_len;          // 偏移配置长度
};
```

## 3. Namespace 创建流程详解

### 3.1 阶段0: 父进程 (STAGE_PARENT)

**主要职责**: 设置用户映射，协调子进程

```c
// libcontainer/nsenter/nsexec.c:900
static void parent_stage(struct nlconfig_t *config)
{
    pid_t stage1_pid = -1, stage2_pid = -1;
    
    // 1. 等待第一阶段进程就绪
    if (sync_wait_for_child(syncpipe, SYNC_RECVPID_PLS) != 0)
        bail("failed to sync with child");
        
    // 接收子进程 PID
    if (read(syncpipe, &stage1_pid, sizeof(stage1_pid)) != sizeof(stage1_pid))
        bail("failed to read child pid");
    
    // 2. 设置用户 ID 映射
    if (config->uidmappath) {
        update_uidmap(config->uidmappath, stage1_pid, 
                     config->uidmap, config->uidmap_len);
    }
    if (config->gidmappath) {
        update_gidmap(config->gidmappath, stage1_pid, 
                     config->gidmap, config->gidmap_len);
    }
    
    // 3. 设置时间偏移 (TIME namespace)
    if (config->time_offsets) {
        update_time_offsets(stage1_pid, config->time_offsets);
    }
    
    // 4. 通知子进程继续
    if (sync_wake_child(syncpipe, SYNC_USERMAP_ACK) != 0)
        bail("failed to sync with child");
}
```

#### 用户映射设置

```c
// libcontainer/nsenter/nsexec.c:393  
static void update_uidmap(const char *path, pid_t pid, char *map, size_t map_len)
{
    // 首先尝试直接写入 /proc/pid/uid_map
    if (write_file(map, map_len, "/proc/%d/uid_map", pid) < 0) {
        // 如果权限不足，尝试使用 newuidmap 工具
        if (errno != EPERM) 
            bail("failed to update /proc/%d/uid_map", pid);
            
        // 使用外部工具进行映射
        if (try_mapping_tool(path, pid, map, map_len))
            bail("failed to use newuid map on %d", pid);
    }
}
```

### 3.2 阶段1: 中间子进程 (STAGE_CHILD)

**主要职责**: 加入现有 namespace，创建新 namespace

```c
// libcontainer/nsenter/nsexec.c:1063
static void child_stage(struct nlconfig_t *config)
{
    // 1. 发送 PID 给父进程
    pid_t stage1_pid = getpid();
    if (write(syncpipe, &stage1_pid, sizeof(stage1_pid)) != sizeof(stage1_pid))
        bail("failed to write pid to parent");
        
    // 2. 等待父进程设置用户映射
    if (sync_wait_for_child(syncpipe, SYNC_USERMAP_ACK) != 0)
        bail("failed to wait for parent to map user");
    
    // 3. 加入现有的 namespace (如果指定了路径)
    if (config->namespaces)
        join_namespaces(config->namespaces);
    
    // 4. 创建用户 namespace (如果需要)
    if (config->cloneflags & CLONE_NEWUSER) {
        if (unshare(CLONE_NEWUSER) < 0)
            bail("failed to unshare user namespace");
    }
    
    // 5. 创建其他 namespace
    try_unshare(config->cloneflags & ~CLONE_NEWUSER, "remaining namespaces");
    
    // 6. Fork 出最终的 init 进程
    stage2_pid = clone_parent(&config, STAGE_INIT);
    if (stage2_pid < 0)
        bail("unable to fork stage-2");
        
    // 7. 等待 init 进程完成初始化
    wait_for_stage2_child(stage2_pid);
}
```

#### Namespace 加入机制

```c
// libcontainer/nsenter/nsexec.c:533
void join_namespaces(char *nsspec)
{
    struct namespace_t *ns_list;
    size_t ns_len;
    
    // 1. 解析 namespace 规格字符串
    // 格式: "net:/proc/1234/ns/net,pid:/proc/1234/ns/pid"
    to_join = __open_namespaces(nsspec, &ns_list, &ns_len);
    
    // 2. 分三个步骤加入，处理权限依赖
    
    // 步骤1: 加入非用户命名空间
    joined |= __join_namespaces(to_join & ~(joined | CLONE_NEWUSER), 
                                ns_list, ns_len);
    
    // 步骤2: 加入用户命名空间
    joined |= __join_namespaces(CLONE_NEWUSER, ns_list, ns_len);
    
    // 步骤3: 加入剩余的命名空间  
    joined |= __join_namespaces(to_join & ~(joined | CLONE_NEWUSER), 
                                ns_list, ns_len);
    
    free_namespaces(ns_list);
}
```

#### 加入单个 Namespace

```c
// libcontainer/nsenter/nsexec.c:458
static nsset_t __join_namespaces(nsset_t allow, struct namespace_t *ns_list, size_t ns_len)
{
    nsset_t joined = 0;
    
    for (size_t i = 0; i < ns_len; i++) {
        struct namespace_t *ns = &ns_list[i];
        int nstype = nstype(ns->type);
        
        if (!(nstype & allow)) 
            continue;
            
        // 使用 setns() 系统调用加入 namespace
        if (setns(ns->fd, nstype) < 0) {
            if (errno == EPERM) 
                continue;  // 跳过权限错误
            bail("failed to setns into %s namespace", ns->type);
        }
        
        joined |= nstype;
        
        // 用户命名空间特殊处理
        if (nstype == CLONE_NEWUSER) {
            if (setresuid(0, 0, 0) < 0)
                bail("failed to become root in user namespace");
            if (setresgid(0, 0, 0) < 0)  
                bail("failed to become root in user namespace");
        }
    }
    return joined;
}
```

### 3.3 阶段2: 最终 init 进程 (STAGE_INIT)

**主要职责**: 进程属性设置，返回 Go 运行时

```c
// libcontainer/nsenter/nsexec.c:1184
static void init_stage(struct nlconfig_t *config)
{
    // 1. 创建新的进程会话
    if (setsid() < 0)
        bail("setsid failed");
    
    // 2. 设置用户和组 ID (如果不在用户命名空间中)
    if (!(config->cloneflags & CLONE_NEWUSER)) {
        if (setresuid(0, 0, 0) < 0)
            bail("failed to setresuid");
        if (setresgid(0, 0, 0) < 0)
            bail("failed to setresgid");
    }
    
    // 3. 设置 OOM 分数调整
    if (config->oom_score_adj && strlen(config->oom_score_adj) > 0) {
        write_file(config->oom_score_adj, strlen(config->oom_score_adj),
                  "/proc/self/oom_score_adj");
    }
    
    // 4. 清理不需要的文件描述符
    if (syncpipe != -1) {
        close(syncpipe);
        syncpipe = -1;
    }
    
    // 5. 设置进程为不可转储 (安全措施)  
    if (config->namespaces) {
        if (prctl(PR_SET_DUMPABLE, 0, 0, 0, 0) < 0)
            bail("failed to set process as non-dumpable");
    }
    
    // 6. 返回到 Go 运行时继续初始化
    return; // 控制权返回 Go
}
```

## 4. Go 运行时集成

### 4.1 标准初始化流程

当 C 代码完成 namespace 设置后，控制权返回到 Go 运行时：

```go
// libcontainer/standard_init_linux.go:52
func (l *linuxStandardInit) Init() error {
    // 1. Keyring 设置
    if !l.config.Config.NoNewKeyring {
        ringname, keepperms, newperms := l.getSessionRingParams()
        // 加入会话 keyring，设置 SELinux 标签
        if err := keys.JoinSessionKeyring(ringname); err != nil {
            return err
        }
    }
    
    // 2. 网络配置 (NEWNET namespace)
    if err := setupNetwork(l.config); err != nil {
        return err
    }
    if err := setupRoute(l.config.Config); err != nil {
        return err
    }
    
    // 3. 根文件系统准备 (NEWNS namespace)  
    if err := prepareRootfs(l.pipe, l.config); err != nil {
        return err
    }
    
    // 4. 挂载命名空间处理
    if l.config.Config.Namespaces.Contains(configs.NEWNS) {
        if err := finalizeRootfs(l.config.Config); err != nil {
            return err
        }
    }
    
    // 5. UTS namespace - 设置主机名
    if hostname := l.config.Config.Hostname; hostname != "" {
        if err := unix.Sethostname([]byte(hostname)); err != nil {
            return err
        }
    }
    
    // 6. 最终命名空间配置
    if err := finalizeNamespace(l.config); err != nil {
        return err
    }
    
    // 7. 执行用户程序
    name, err := exec.LookPath(l.config.Args[0])
    if err != nil {
        return err
    }
    
    return system.Exec(name, l.config.Args, os.Environ())
}
```

### 4.2 网络配置示例

```go
// libcontainer/standard_init_linux.go:96
func setupNetwork(config *initConfig) error {
    for _, config := range config.Config.Networks {
        strategy, err := getStrategy(config.Type)  
        if err != nil {
            return err
        }
        if err := strategy.create((*Network)(config), config.Pid); err != nil {
            return err
        }
    }
    return nil
}
```

### 4.3 主机名设置示例

```go
// UTS namespace 中的主机名设置
if hostname := l.config.Config.Hostname; hostname != "" {
    if err := unix.Sethostname([]byte(hostname)); err != nil {
        return fmt.Errorf("failed to set hostname %q: %w", hostname, err)
    }
}

// 域名设置
if domainname := l.config.Config.Domainname; domainname != "" {
    if err := unix.Setdomainname([]byte(domainname)); err != nil {
        return fmt.Errorf("failed to set domainname %q: %w", domainname, err)
    }
}
```

## 5. Namespace 创建顺序和依赖关系

### 5.1 创建顺序原则

runc 严格按照以下顺序处理 namespace：

```go
// libcontainer/configs/namespaces_linux.go:123
func NamespaceTypes() []NamespaceType {
    return []NamespaceType{
        NEWUSER,   // 1. 用户命名空间 - 必须最先
        NEWIPC,    // 2. IPC 命名空间
        NEWUTS,    // 3. UTS 命名空间  
        NEWNET,    // 4. 网络命名空间
        NEWPID,    // 5. PID 命名空间
        NEWNS,     // 6. 挂载命名空间
        NEWCGROUP, // 7. Cgroup 命名空间
        NEWTIME,   // 8. 时间命名空间
    }
}
```

### 5.2 依赖关系详解

#### 用户命名空间的特殊地位

```
NEWUSER (用户命名空间)
    │
    │ 必须首先创建，因为：
    │ 1. 影响其他 namespace 的权限检查
    │ 2. 创建后才能进行 ID 映射
    │ 3. 其他 namespace 的创建可能需要相应权限
    │
    ├── NEWIPC (需要 IPC 权限)
    ├── NEWUTS (需要 SYS_ADMIN 权限)
    ├── NEWNET (需要 NET_ADMIN 权限)  
    ├── NEWPID (需要 SYS_ADMIN 权限)
    ├── NEWNS  (需要 SYS_ADMIN 权限)
    └── NEWCGROUP (需要 SYS_ADMIN 权限)
```

#### 权限检查逻辑

```go
// 检查创建 namespace 所需的权限
func checkNamespacePermissions(ns NamespaceType) error {
    switch ns {
    case NEWUSER:
        // 用户命名空间不需要特殊权限
        return nil
    case NEWNET:
        // 需要 CAP_NET_ADMIN 或在用户命名空间中
        return checkCapability(unix.CAP_NET_ADMIN)
    case NEWNS, NEWUTS, NEWPID, NEWIPC, NEWCGROUP:
        // 需要 CAP_SYS_ADMIN 或在用户命名空间中
        return checkCapability(unix.CAP_SYS_ADMIN)
    }
    return nil
}
```

### 5.3 同步机制详解

#### 同步消息类型

```c
// libcontainer/nsenter/nsexec.c:60
enum sync_t {
    SYNC_USERMAP_PLS = 0x40,      // 请求父进程进行用户映射
    SYNC_USERMAP_ACK = 0x41,      // 用户映射完成确认
    SYNC_RECVPID_PLS = 0x42,      // 发送 PID 请求
    SYNC_RECVPID_ACK = 0x43,      // PID 接收确认  
    SYNC_GRANDCHILD = 0x44,       // 孙进程就绪信号
    SYNC_CHILD_FINISH = 0x45,     // 子进程完成信号
    SYNC_TIMEOFFSETS_PLS = 0x46,  // 请求设置时间偏移
    SYNC_TIMEOFFSETS_ACK = 0x47,  // 时间偏移设置完成
};
```

#### 同步流程图

```
父进程 (STAGE_PARENT)          中间进程 (STAGE_CHILD)           最终进程 (STAGE_INIT)
      │                              │                               │
      │◄────── SYNC_RECVPID_PLS ─────┤                               │
      │                              │                               │
      │─── update_uidmap/gidmap ──── │                               │
      │                              │                               │  
      │────── SYNC_USERMAP_ACK ─────►│                               │
      │                              │                               │
      │                              │─── unshare/join namespaces ──│
      │                              │                               │
      │                              │────────── fork() ───────────►│
      │                              │                               │
      │◄──── SYNC_GRANDCHILD ────────┼───────────────────────────────│
      │                              │                               │
      │────── SYNC_CHILD_FINISH ────►│                               │
      │                              │                               │
      │                              │ exit                          │ init...
```

## 6. 高级特性和优化

### 6.1 时间命名空间处理

时间命名空间是较新的功能 (Linux 5.6+)，允许容器有不同的系统时间：

```c
// 设置时间偏移
static void update_time_offsets(pid_t pid, char *offsets)
{
    char *saveptr = NULL;
    char *offset_str = strtok_r(offsets, " ", &saveptr);
    
    while (offset_str != NULL) {
        // 解析偏移格式: "monotonic 1000000000 0"  
        char *clock_id = strtok_r(offset_str, " ", &saveptr);
        char *sec_str = strtok_r(NULL, " ", &saveptr);  
        char *nsec_str = strtok_r(NULL, " ", &saveptr);
        
        // 写入 /proc/pid/timens_offsets
        int fd = open_proc_file(pid, "timens_offsets", O_WRONLY);
        dprintf(fd, "%s %s %s\n", clock_id, sec_str, nsec_str);
        close(fd);
        
        offset_str = strtok_r(NULL, " ", &saveptr);
    }
}
```

### 6.2 Rootless 容器支持

Rootless 模式允许普通用户创建容器：

```go
// 检查是否运行在 rootless 模式
func isRootless() bool {
    return os.Geteuid() != 0
}

// rootless 模式的特殊处理
func handleRootlessNamespaces(namespaces Namespaces) error {
    if !isRootless() {
        return nil
    }
    
    // rootless 模式必须包含用户命名空间
    if !namespaces.Contains(NEWUSER) {
        return errors.New("rootless containers require user namespaces")
    }
    
    // 某些功能在 rootless 模式下受限
    for _, ns := range namespaces {
        switch ns.Type {
        case NEWNET:
            // 网络命名空间在 rootless 模式下功能受限
            logrus.Warn("network namespace has limited functionality in rootless mode")
        }
    }
    
    return nil
}
```

### 6.3 性能优化

#### 批量 Namespace 操作

```c
// 批量创建多个 namespace，减少系统调用次数
int create_namespaces_batch(uint32_t clone_flags) {
    // 一次 unshare 调用创建多个 namespace
    if (unshare(clone_flags) < 0) {
        // 如果批量创建失败，逐个尝试
        for (int i = 0; i < 32; i++) {
            uint32_t flag = 1 << i;
            if (clone_flags & flag) {
                if (unshare(flag) < 0 && errno != EINVAL) {
                    return -1;
                }
            }
        }
    }
    return 0;
}
```

#### 文件描述符缓存

```c
// 缓存 namespace 文件描述符，避免重复打开
static int ns_fd_cache[8] = {-1, -1, -1, -1, -1, -1, -1, -1};

int get_namespace_fd(const char *ns_path) {
    // 检查缓存
    for (int i = 0; i < 8; i++) {
        if (ns_fd_cache[i] != -1) {
            char fd_path[PATH_MAX];
            snprintf(fd_path, sizeof(fd_path), "/proc/self/fd/%d", ns_fd_cache[i]);
            if (strcmp(readlink(fd_path), ns_path) == 0) {
                return ns_fd_cache[i];
            }
        }
    }
    
    // 打开并缓存
    int fd = open(ns_path, O_RDONLY);
    if (fd >= 0) {
        // 找空位缓存
        for (int i = 0; i < 8; i++) {
            if (ns_fd_cache[i] == -1) {
                ns_fd_cache[i] = fd;
                break;
            }
        }
    }
    return fd;
}
```

## 7. 调试和故障排除

### 7.1 常见问题诊断

#### 权限问题诊断

```bash
# 检查用户命名空间支持
$ cat /proc/sys/user/max_user_namespaces
65536

# 检查当前进程的 namespace
$ ls -la /proc/self/ns/
lrwxrwxrwx 1 user user 0 Jan  1 10:00 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 mnt -> 'mnt:[4026531840]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 net -> 'net:[4026531992]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 pid -> 'pid:[4026531836]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 user -> 'user:[4026531837]'
lrwxrwxrwx 1 user user 0 Jan  1 10:00 uts -> 'uts:[4026531838]'

# 检查用户映射
$ cat /proc/1234/uid_map
         0       1000          1
         1       1001      65534
```

#### 调试信息收集

```go
// 添加 namespace 调试信息
func debugNamespaces() {
    nsTypes := []string{"cgroup", "ipc", "mnt", "net", "pid", "user", "uts"}
    
    fmt.Println("Current namespace information:")
    for _, nsType := range nsTypes {
        nsPath := fmt.Sprintf("/proc/self/ns/%s", nsType)
        if target, err := os.Readlink(nsPath); err == nil {
            fmt.Printf("  %s: %s\n", nsType, target)
        } else {
            fmt.Printf("  %s: error reading (%v)\n", nsType, err)
        }
    }
    
    // 检查用户映射
    if data, err := os.ReadFile("/proc/self/uid_map"); err == nil {
        fmt.Printf("UID mapping:\n%s", string(data))
    }
    if data, err := os.ReadFile("/proc/self/gid_map"); err == nil {
        fmt.Printf("GID mapping:\n%s", string(data))
    }
}
```

### 7.2 性能分析

```bash
# 使用 strace 跟踪系统调用
$ strace -f -e trace=clone,unshare,setns runc create mycontainer

# 使用 perf 分析性能
$ perf record runc run mycontainer
$ perf report

# 检查 namespace 创建时间
$ time runc create mycontainer
```

## 8. 实践练习

### 8.1 手动创建 Namespace

体验不同类型的 namespace 隔离效果：

```bash
#!/bin/bash
# 练习1：创建 PID namespace
sudo unshare --pid --fork --mount-proc /bin/bash
# 在新 shell 中执行:
ps aux  # 只能看到当前 namespace 的进程

# 练习2：创建网络 namespace  
sudo unshare --net /bin/bash
ip link show  # 只能看到 loopback 接口

# 练习3：创建挂载 namespace
sudo unshare --mount /bin/bash
mount -t tmpfs tmpfs /tmp
ls /tmp  # 只在当前 namespace 中可见

# 练习4：创建 UTS namespace
sudo unshare --uts /bin/bash  
hostname container-test
hostname  # 只在当前 namespace 中生效
```

### 8.2 自定义 Namespace 配置

修改容器配置体验不同的 namespace 组合：

```json
{
  "ociVersion": "1.0.2",
  "process": {
    "args": ["/bin/sh"]
  },
  "root": {
    "path": "rootfs"
  },
  "linux": {
    "namespaces": [
      {"type": "pid"},
      {"type": "network"}, 
      {"type": "mount"},
      {"type": "uts"}
      // 故意省略 user namespace，观察权限变化
    ]
  }
}
```

### 8.3 Namespace 性能测试

```bash
#!/bin/bash
# 测试不同 namespace 组合的创建时间

test_namespace_performance() {
    local namespaces="$1"
    local desc="$2"
    
    echo "Testing $desc..."
    time for i in {1..100}; do
        sudo unshare $namespaces /bin/true
    done
}

# 测试各种组合
test_namespace_performance "--pid" "PID namespace only"
test_namespace_performance "--pid --net" "PID + Network"
test_namespace_performance "--pid --net --mount --uts --ipc" "All common namespaces"
test_namespace_performance "--user --pid --net --mount --uts --ipc" "Including user namespace"
```

### 8.4 调试 runc Namespace 创建

```bash
# 启用 runc 调试日志
export RUNC_DEBUG=1

# 跟踪 namespace 创建过程
strace -f -e trace=clone,unshare,setns,openat -o /tmp/runc.strace \
    runc create mycontainer

# 分析结果
grep -E "(clone|unshare|setns)" /tmp/runc.strace | head -20
```

## 9. 思考题

### 9.1 架构设计思考

1. **三阶段设计的必要性**：为什么 runc 需要三阶段进程创建？能否简化为两阶段？

2. **用户命名空间优先级**：为什么用户命名空间必须最先创建？如果顺序错误会发生什么？

3. **同步机制复杂性**：父子进程之间的同步为什么这么复杂？有没有更简单的方案？

### 9.2 技术实现思考

4. **C/Go 混合编程**：为什么底层 namespace 操作用 C 实现，而不是纯 Go？

5. **错误处理策略**：如果某个 namespace 创建失败，runc 如何进行清理？

6. **性能优化空间**：当前的实现有哪些性能瓶颈？如何优化？

### 9.3 安全性思考

7. **权限逃逸风险**：user namespace 的 ID 映射有什么安全风险？

8. **隔离完整性**：如何确保容器无法看到或影响宿主机的其他 namespace？

9. **Rootless 安全性**：rootless 容器是否真的更安全？有什么局限性？

### 9.4 扩展性思考

10. **新 Namespace 支持**：如果 Linux 内核增加新的 namespace 类型，runc 需要如何修改？

## 10. 扩展阅读

### 10.1 Linux 内核文档

- [Namespaces in operation](https://lwn.net/Articles/531114/)
- [User namespaces](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
- [PID namespaces](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)
- [Network namespaces](https://man7.org/linux/man-pages/man7/network_namespaces.7.html)

### 10.2 系统调用参考

- [clone(2)](https://man7.org/linux/man-pages/man2/clone.2.html)
- [unshare(2)](https://man7.org/linux/man-pages/man2/unshare.2.html)  
- [setns(2)](https://man7.org/linux/man-pages/man2/setns.2.html)
- [nsenter(1)](https://man7.org/linux/man-pages/man1/nsenter.1.html)

### 10.3 深入学习资源

- [Linux Container Primitives](https://medium.com/@saschagrunert/demystifying-containers-101-a-deep-dive-into-container-technology-for-beginners-d7b60d8511c1)
- [Container Runtimes](https://www.ianlewis.org/en/container-runtimes-part-1-introduction-container-r)
- [Rootless Containers](https://rootlesscontaine.rs/)

## 🎯 模块总结

通过本模块的学习，你应该已经掌握了：

✅ **8种 Namespace 类型**：理解每种 namespace 的作用和隔离范围  
✅ **三阶段进程模型**：理解复杂的进程创建和同步机制  
✅ **底层实现原理**：掌握 C 代码实现和系统调用使用  
✅ **权限和依赖关系**：理解 namespace 创建顺序和权限要求  
✅ **调试和优化方法**：具备故障排除和性能分析能力  

**下一步**: 进入 [模块 4: Cgroups 资源管理](./04-Cgroups资源管理.md)，学习容器资源限制和监控机制。