---
title: runc 容器生命周期流程图
date: 2024-01-20
tags:
 - runc
 - 容器生命周期
 - 流程图
 - 架构图
 - 容器技术
 - 可视化
 - 系统设计
categories: 
 - cloud-base
sidebar: auto
description: 通过详细的流程图和架构图展示runc容器生命周期的各个阶段，包括创建、启动、运行等关键流程
---

# runc 容器生命周期流程图

## 1. runc 容器创建总体流程

```mermaid
graph TD
    A[runc create/run] --> B[解析OCI配置]
    B --> C[创建Factory]
    C --> D[生成libcontainer配置]
    D --> E[创建Container实例]
    E --> F[启动父进程]
    F --> G[nsexec.c引导]
    G --> H[创建命名空间]
    H --> I[设置安全策略]
    I --> J[挂载文件系统]
    J --> K[应用资源限制]
    K --> L[执行init进程]
    L --> M[启动容器进程]
    M --> N[容器运行中]
```

## 2. runc 命令流程对比

```mermaid
graph LR
    subgraph CREATE["runc create"]
        A1[create命令] --> B1[startContainer]
        B1 --> C1[CT_ACT_CREATE]
        C1 --> D1[容器已创建但未启动]
    end
    
    subgraph START["runc start"]
        A2[start命令] --> B2[加载现有容器]
        B2 --> C2[container.Start]
        C2 --> D2[启动容器进程]
    end
    
    subgraph RUN["runc run"]
        A3[run命令] --> B3[startContainer]
        B3 --> C3[CT_ACT_RUN]
        C3 --> D3[创建并立即启动]
    end
```

## 3. nsexec.c 三阶段引导过程

```mermaid
graph TD
    A[Stage 0: STAGE_PARENT] --> B[Stage 1: STAGE_CHILD]
    B --> C[Stage 2: STAGE_INIT]
    
    subgraph STAGE0["Stage 0 详细"]
        A1[解析netlink配置]
        A2[创建子进程clone_parent]
        A3[处理用户命名空间映射]
        A4[管理进程同步]
    end
    
    subgraph STAGE1["Stage 1 详细"]
        B1[加入指定命名空间setns]
        B2[unshare新命名空间]
        B3[创建PID命名空间子进程]
        B4[协调用户命名空间映射]
    end
    
    subgraph STAGE2["Stage 2 详细"]
        C1[设置会话ID setsid]
        C2[切换到容器用户/组]
        C3[返回Go运行时最终设置]
    end
```

## 4. 命名空间创建顺序和依赖关系

```
命名空间创建顺序（关键在于User NS必须最先创建）:

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User NS     │───▶│ IPC NS      │───▶│ UTS NS      │
│ (NEWUSER)   │    │ (NEWIPC)    │    │ (NEWUTS)    │
│ 用户隔离    │    │ IPC隔离     │    │ 主机名隔离  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Network NS  │    │ PID NS      │    │ Mount NS    │
│ (NEWNET)    │    │ (NEWPID)    │    │ (NEWNS)     │
│ 网络隔离    │    │ 进程隔离    │    │ 文件系统隔离│
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐
│ Cgroup NS   │    │ Time NS     │
│ (NEWCGROUP) │    │ (NEWTIME)   │
│ Cgroup隔离  │    │ 时间隔离    │
└─────────────┘    └─────────────┘
```

## 5. 进程通信和同步机制

```
父进程 (runc)          子进程 (init)         容器进程
      │                     │                    │
      │  initSockParent ◄──►│ initSockChild      │
      │  ─────────────────── │                   │
      │                     │                   │
      │  syncSockParent ◄──►│ syncSockChild      │
      │  ─────────────────── │                   │
      │                     │                   │
      │  logPipeParent  ◄───│ logPipeChild       │
      │  ─────────────────── │                   │
      │                     │                   │
      │     FIFO通道     ◄──│────────────────────│
      │  ─────────────────── │                   │
      
同步消息类型:
- SYNC_USERMAP_PLS/ACK  (用户映射请求/确认)
- SYNC_RECVPID_PLS/ACK  (PID发送请求/确认)
- SYNC_GRANDCHILD       (孙进程就绪)
- SYNC_CHILD_FINISH     (子进程完成)
- SYNC_TIMEOFFSETS_*    (时间偏移设置)
```

## 6. 安全策略应用流程

```mermaid
graph TD
    A[容器创建] --> B[命名空间隔离]
    B --> C[用户权限管理]
    C --> D[Capabilities设置]
    D --> E[Seccomp过滤器]
    E --> F[LSM策略应用]
    F --> G[NoNewPrivileges]
    G --> H[文件系统安全]
    H --> I[资源限制]
    I --> J[执行容器进程]
    
    subgraph SECURITY["安全层级"]
        B1[命名空间隔离 - 第一层]
        D1[Capabilities - 第二层]
        E1[Seccomp - 第三层]
        F1[AppArmor/SELinux - 第四层]
        I1[Cgroups限制 - 第五层]
    end
```

## 7. 文件系统挂载和隔离流程

```
┌────────────────────────────────────────────────────────────┐
│                      Rootfs 准备流程                       │
├────────────────────────────────────────────────────────────┤
│                                                           │
│  1. Mount Namespace 创建                                  │
│     └── unshare(CLONE_NEWNS)                             │
│                                                           │
│  2. 基础挂载点准备                                        │
│     ├── /proc (proc文件系统)                             │
│     ├── /sys (sysfs文件系统)                             │
│     ├── /dev (devtmpfs或bind挂载)                        │
│     └── /dev/pts (devpts伪终端)                          │
│                                                           │
│  3. 用户挂载点处理                                        │
│     ├── bind挂载 (源目录绑定)                            │
│     ├── tmpfs挂载 (内存文件系统)                         │
│     └── 特殊文件系统                                      │
│                                                           │
│  4. 安全挂载选项                                          │
│     ├── MS_NOEXEC (禁止执行)                             │
│     ├── MS_NOSUID (禁止setuid)                           │
│     ├── MS_NODEV (禁止设备文件)                          │
│     └── 挂载传播控制                                      │
│                                                           │
│  5. pivot_root或chroot                                   │
│     └── 切换根文件系统                                    │
│                                                           │
│  6. 路径安全处理                                          │
│     ├── MaskedPaths (隐藏路径)                           │
│     └── ReadonlyPaths (只读路径)                         │
│                                                           │
└────────────────────────────────────────────────────────────┘
```

## 8. Cgroups 资源管理架构

```mermaid
graph TB
    A[Container] --> B[Cgroup Manager]
    B --> C[Memory Controller]
    B --> D[CPU Controller]
    B --> E[BlockIO Controller]
    B --> F[Device Controller]
    B --> G[Network Controller]
    
    C --> C1[memory.limit_in_bytes]
    C --> C2[memory.oom_control]
    C --> C3[memory.swappiness]
    
    D --> D1[cpu.shares]
    D --> D2[cpu.cfs_quota_us]
    D --> D3[cpu.cfs_period_us]
    D --> D4[cpuset.cpus]
    
    E --> E1[blkio.weight]
    E --> E2[blkio.throttle.read_bps_device]
    E --> E3[blkio.throttle.write_bps_device]
    
    F --> F1[devices.allow]
    F --> F2[devices.deny]
    
    G --> G1[net_cls.classid]
    G --> G2[net_prio.ifpriomap]
```

## 9. 容器状态转换图

```mermaid
stateDiagram-v2
    [*] --> Creating: runc create/run
    Creating --> Created: 创建成功
    Creating --> [*]: 创建失败
    
    Created --> Running: runc start
    Created --> [*]: runc delete
    
    Running --> Paused: runc pause
    Paused --> Running: runc resume
    
    Running --> Stopped: 进程退出
    Paused --> Stopped: runc kill
    
    Stopped --> [*]: runc delete
    
    note right of Creating
        - OCI配置解析
        - 命名空间创建
        - 资源分配
    end note
    
    note right of Running
        - 进程执行中
        - 资源监控
        - 信号处理
    end note
```

## 10. runc 错误处理和清理流程

```
┌─────────────────────────────────────────────────────────────┐
│                    错误处理和清理机制                        │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  创建阶段错误处理:                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  defer func() {                                     │   │
│  │      if retErr != nil {                             │   │
│  │          _ = p.terminate()        // 终止进程       │   │
│  │          _ = p.manager.Destroy()  // 清理cgroup     │   │
│  │          _ = p.intelRdtManager.Destroy() // 清理RDT │   │
│  │      }                                              │   │
│  │  }()                                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                            │
│  运行时错误检测:                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - OOM检测和处理                                     │   │
│  │  - 进程退出状态监控                                  │   │
│  │  - 信号传播和处理                                    │   │
│  │  - 僵尸进程清理                                      │   │
│  │  - 文件描述符泄漏防护                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                            │
│  清理顺序:                                                 │
│  1. 发送SIGKILL信号                                        │
│  2. 等待进程终止                                           │
│  3. 清理cgroup资源                                         │
│  4. 清理Intel RDT资源                                      │
│  5. 清理挂载点                                             │
│  6. 清理状态文件                                           │
│  7. 关闭通信通道                                           │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## 11. 网络配置和管理流程

```mermaid
graph TD
    A[容器网络配置] --> B[Network Namespace创建]
    B --> C[网络策略应用]
    C --> D[Loopback接口配置]
    C --> E[外部网络接口]
    C --> F[路由配置]
    
    D --> D1[lo接口启动]
    D --> D2[127.0.0.1配置]
    
    E --> E1[veth pair创建]
    E --> E2[接口移动到容器NS]
    E --> E3[IP地址配置]
    
    F --> F1[默认路由]
    F --> F2[静态路由]
    F --> F3[路由策略]
    
    subgraph NETWORK["网络隔离层级"]
        G1[网络命名空间隔离]
        G2[接口级别隔离]
        G3[路由级别隔离]
        G4[防火墙规则隔离]
    end
```

## 12. 系统调用使用时序图

```mermaid
sequenceDiagram
    participant P as Parent Process
    participant C as Child Process
    participant K as Linux Kernel
    
    P->>K: clone(CLONE_NEWNS|CLONE_NEWPID|...)
    K-->>P: child_pid
    
    P->>C: 发送配置数据
    C->>K: setns(existing_ns_fd)
    C->>K: unshare(CLONE_NEWUSER)
    C->>K: prctl(PR_SET_NO_NEW_PRIVS)
    
    C->>K: mount('/proc', '/proc', 'proc', MS_NOEXEC|MS_NOSUID|MS_NODEV)
    C->>K: mount('/sys', '/sys', 'sysfs', MS_NOEXEC|MS_NOSUID|MS_NODEV)
    C->>K: mount('/dev', '/dev', 'devtmpfs', 0)
    
    C->>K: pivot_root('/container/root', '/container/root/old')
    C->>K: umount('/old')
    
    C->>K: capset(&header, &data)
    C->>K: prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog)
    
    C->>K: execve('/container/bin/app', argv, envp)
    K-->>C: 容器进程开始执行
```

## 13. runc create 调试追踪流程图

```mermaid
sequenceDiagram
    participant CLI as runc CLI
    participant Factory as LinuxFactory
    participant Container as Container
    participant InitProcess as initProcess
    participant NSExec as nsexec.c
    participant Kernel as Linux Kernel
    participant CgroupMgr as CgroupManager

    Note over CLI: runc create mycontainer
    CLI->>Factory: Create(id='mycontainer', config)
    Note right of Factory: 调试点 1: 验证容器ID和配置
    
    Factory->>Factory: validateConfig(config)
    Factory->>Factory: createContainerRoot('/run/runc/mycontainer')
    Factory->>Container: newContainer(id, config, factory)
    
    Note over Container: 调试点 2: 容器实例初始化
    Container->>Container: loadState()
    Container->>CgroupMgr: NewManager(config.Cgroups)
    
    CLI->>Container: Start(process)
    Note right of Container: 调试点 3: 进程启动准备
    
    Container->>InitProcess: newInitProcess(config, factory, pipe)
    InitProcess->>InitProcess: createPipes() 
    Note right of InitProcess: 创建通信管道: initSock, syncSock, logPipe
    
    Container->>InitProcess: start()
    Note over InitProcess: 调试点 4: 父进程准备
    
    InitProcess->>Kernel: clone(CLONE_PARENT | SIGCHLD)
    Note right of Kernel: 系统调用追踪: SYS_clone
    Kernel-->>InitProcess: child_pid
    
    par 父进程分支
        InitProcess->>InitProcess: parent.start()
        InitProcess->>CgroupMgr: Apply(child_pid)
        Note right of CgroupMgr: 调试点 5: Cgroup资源应用
        CgroupMgr->>Kernel: write cgroup.procs
        
        InitProcess->>InitProcess: sendConfig(initSock)
        Note right of InitProcess: 发送OCI配置到子进程
        
        InitProcess->>InitProcess: waitForSync(SYNC_USERMAP_PLS)
        InitProcess->>Kernel: write /proc/child_pid/uid_map
        InitProcess->>Kernel: write /proc/child_pid/gid_map
        Note right of Kernel: 调试点 6: 用户命名空间映射
        
        InitProcess->>InitProcess: sendSync(SYNC_USERMAP_ACK)
    and 子进程分支 (nsexec.c)
        NSExec->>NSExec: nsexec_main()
        Note over NSExec: 调试点 7: C引导程序入口
        
        NSExec->>NSExec: receiveConfig(initSock)
        NSExec->>NSExec: stage_child_func()
        
        NSExec->>Kernel: setns(config.namespaces)
        Note right of Kernel: 系统调用追踪: SYS_setns
        
        NSExec->>Kernel: unshare(CLONE_NEWUSER)
        Note right of Kernel: 系统调用追踪: SYS_unshare
        
        NSExec->>NSExec: sendSync(SYNC_USERMAP_PLS)
        NSExec->>NSExec: waitForSync(SYNC_USERMAP_ACK)
        
        NSExec->>Kernel: clone(CLONE_PARENT | child_flags)
        Note right of Kernel: 调试点 8: 孙进程创建 (PID=1)
        Kernel-->>NSExec: grandchild_pid
        
        NSExec->>NSExec: stage_init_func()
        Note over NSExec: 调试点 9: 最终初始化阶段
        
        NSExec->>Kernel: setsid()
        NSExec->>Kernel: setuid(config.uid)
        NSExec->>Kernel: setgid(config.gid)
        
        NSExec->>NSExec: return_to_go_runtime()
    end
    
    Note over InitProcess,NSExec: 调试点 10: 回到Go运行时
    InitProcess->>InitProcess: finalizeContainer()
    InitProcess->>Kernel: 关闭不需要的文件描述符
    
    Container->>Container: updateState(Created)
    Container->>Container: saveState()
    
    Note over CLI: 容器创建完成，状态: Created
```

## 14. runc start 调试追踪流程图

```mermaid
sequenceDiagram
    participant CLI as runc CLI
    participant Container as Container
    participant Process as execProcess
    participant InitProcess as initProcess
    participant Kernel as Linux Kernel
    participant App as 容器应用

    Note over CLI: runc start mycontainer
    CLI->>Container: loadContainer('mycontainer')
    Container->>Container: loadState()
    Note right of Container: 调试点 1: 加载容器状态
    
    Container->>Container: currentStatus()
    alt 状态检查失败
        Container-->>CLI: ErrNotCreated
    else 状态为 Created
        Container->>InitProcess: start()
        Note over InitProcess: 调试点 2: 启动初始化进程
    end
    
    InitProcess->>InitProcess: signal(FIFO)
    Note right of InitProcess: 通过FIFO信号启动容器进程
    
    InitProcess->>Kernel: write(exec_fifo_fd, '0')
    Note right of Kernel: 系统调用追踪: SYS_write
    
    Note over Process: 容器内进程被唤醒
    Process->>Process: 读取FIFO信号
    Process->>Kernel: close(exec_fifo_fd)
    
    Process->>Process: setupMounts()
    Note right of Process: 调试点 3: 文件系统挂载
    
    loop 处理每个挂载点
        Process->>Kernel: mount(source, target, fstype, flags, data)
        Note right of Kernel: 系统调用追踪: SYS_mount
        Process->>Process: validateMountTarget()
    end
    
    Process->>Process: applySecurityProfile()
    Note over Process: 调试点 4: 安全策略应用
    
    Process->>Kernel: prctl(PR_SET_NO_NEW_PRIVS, 1)
    Note right of Kernel: 禁用新权限获取
    
    Process->>Process: setupCapabilities()
    Process->>Kernel: capset(&header, &data)
    Note right of Kernel: 系统调用追踪: SYS_capset
    
    Process->>Process: setupSeccomp()
    Process->>Kernel: prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog)
    Note right of Kernel: 系统调用追踪: SYS_prctl (seccomp)
    
    Process->>Process: applyAppArmor/SELinux()
    Note right of Process: 调试点 5: LSM策略应用
    
    Process->>Kernel: execve(container_binary, args, env)
    Note right of Kernel: 系统调用追踪: SYS_execve
    
    Kernel->>App: 容器应用进程启动
    Note over App: 调试点 6: 应用进程运行
    
    Container->>Container: updateState(Running)
    Container->>Container: saveState()
    
    Note over CLI: 容器启动完成，状态: Running
```

## 15. 命名空间设置详细调试流程图

```mermaid
graph TD
    A[nsexec.c 入口] --> B[解析命名空间配置]
    B --> C{用户命名空间优先}
    
    C -->|是| D[unshare CLONE_NEWUSER]
    C -->|否| E[检查现有命名空间]
    
    D --> F[等待父进程设置映射]
    F --> G[接收映射完成确认]
    G --> H[setns 加入现有命名空间]
    
    E --> H
    H --> I[unshare 创建新命名空间]
    
    subgraph DEBUG["调试追踪点"]
        T1["strace: unshare系统调用"]
        T2["/proc/pid/ns/ 文件检查"]
        T3["命名空间inode变化"]
        T4["权限映射验证"]
    end
    
    I --> J{命名空间类型检查}
    
    J -->|PID| K[创建PID命名空间]
    J -->|NET| L[创建网络命名空间]
    J -->|MNT| M[创建挂载命名空间]
    J -->|IPC| N[创建IPC命名空间]
    J -->|UTS| O[创建UTS命名空间]
    J -->|CGROUP| P[创建Cgroup命名空间]
    
    K --> K1[clone with CLONE_NEWPID]
    K1 --> K2[新进程PID=1]
    
    L --> L1[网络栈隔离]
    L1 --> L2[loopback接口创建]
    
    M --> M1[挂载表私有化]
    M1 --> M2[pivot_root准备]
    
    N --> N1[IPC资源隔离]
    O --> O1[主机名/域名隔离]
    P --> P1[Cgroup视图隔离]
    
    K2 --> Q[同步父进程]
    L2 --> Q
    M2 --> Q
    N1 --> Q
    O1 --> Q
    P1 --> Q
    
    Q --> R[返回Go运行时]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style T1 fill:#ff9,stroke:#333,stroke-width:1px
    style T2 fill:#ff9,stroke:#333,stroke-width:1px
    style T3 fill:#ff9,stroke:#333,stroke-width:1px
    style T4 fill:#ff9,stroke:#333,stroke-width:1px
```

## 16. Cgroup资源管理调试流程图

```mermaid
sequenceDiagram
    participant CgroupMgr as CgroupManager
    participant CgroupFS as CgroupFS
    participant Kernel as Linux Kernel
    participant Process as Container Process

    Note over CgroupMgr: 调试点 1: Cgroup管理器初始化
    CgroupMgr->>CgroupMgr: detectCgroupVersion()
    
    alt Cgroup v1
        CgroupMgr->>CgroupFS: /sys/fs/cgroup/memory/
        CgroupMgr->>CgroupFS: /sys/fs/cgroup/cpu/
        CgroupMgr->>CgroupFS: /sys/fs/cgroup/blkio/
    else Cgroup v2
        CgroupMgr->>CgroupFS: /sys/fs/cgroup/ (unified)
    end
    
    Note over CgroupMgr: 调试点 2: 创建容器Cgroup
    CgroupMgr->>CgroupFS: mkdir /sys/fs/cgroup/memory/docker/container_id
    CgroupMgr->>CgroupFS: mkdir /sys/fs/cgroup/cpu/docker/container_id
    
    Note over CgroupMgr: 调试点 3: 应用资源限制
    CgroupMgr->>CgroupFS: echo 134217728 > memory.limit_in_bytes
    Note right of CgroupFS: 内存限制: 128MB
    
    CgroupMgr->>CgroupFS: echo 512 > cpu.shares
    Note right of CgroupFS: CPU权重设置
    
    CgroupMgr->>CgroupFS: echo 50000 > cpu.cfs_quota_us
    CgroupMgr->>CgroupFS: echo 100000 > cpu.cfs_period_us
    Note right of CgroupFS: CPU配额: 50% CPU时间
    
    Note over CgroupMgr: 调试点 4: 进程加入Cgroup
    CgroupMgr->>CgroupFS: echo pid > cgroup.procs
    Note right of CgroupFS: 将进程PID写入Cgroup
    
    CgroupFS->>Kernel: 通知内核应用限制
    Kernel->>Process: 资源限制生效
    
    Note over CgroupMgr: 调试点 5: 实时监控
    loop 监控循环
        CgroupMgr->>CgroupFS: cat memory.usage_in_bytes
        CgroupFS-->>CgroupMgr: 当前内存使用量
        
        CgroupMgr->>CgroupFS: cat cpu.stat
        CgroupFS-->>CgroupMgr: CPU使用统计
        
        alt 内存使用超限
            Kernel->>Process: OOM Kill信号
            Note right of Process: 调试点 6: OOM事件追踪
        end
    end
```

## 17. 系统调用级别调试命令参考

```bash
# 调试点追踪命令集合

# 1. 追踪容器创建的系统调用
strace -f -e trace=clone,unshare,setns,mount,pivot_root,capset,prctl,execve \
  runc create mycontainer

# 2. 监控命名空间变化
watch -n 1 'ls -la /proc/$(pgrep -f 'runc.*mycontainer')/ns/'

# 3. 追踪Cgroup文件系统操作
inotifywait -m -r /sys/fs/cgroup/ --format '%w%f %e' | grep mycontainer

# 4. 监控容器进程的能力集变化
watch -n 1 'grep Cap /proc/$(pgrep -f 'container-app')/status'

# 5. 追踪网络命名空间操作
ip netns monitor

# 6. 实时查看容器资源使用
watch -n 1 'cat /sys/fs/cgroup/memory/docker/mycontainer/memory.usage_in_bytes
              cat /sys/fs/cgroup/cpu/docker/mycontainer/cpuacct.usage'

# 7. 追踪seccomp过滤器应用
dmesg | grep seccomp

# 8. 调试挂载操作
cat /proc/mounts | grep mycontainer
findmnt --tree

# 9. 验证用户命名空间映射
cat /proc/$(pgrep -f mycontainer)/uid_map
cat /proc/$(pgrep -f mycontainer)/gid_map

# 10. 追踪进程间通信
lsof -p $(pgrep -f 'runc.*mycontainer') | grep pipe
```

这些图表详细展示了runc容器运行时的各个关键流程，从高层架构到具体实现细节，特别是添加了系统调用级别的调试追踪点，帮助理解runc是如何协调Linux内核的各种特性来实现安全、隔离的容器环境。