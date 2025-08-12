---
title: CRIU 检查点与恢复
date: 2025-08-07
tags:
 - runc
 - 云原生
 - CRIU
categories:
 - 云原生
sidebar: auto
---

# CRIU 检查点与恢复

> **系列导航：** [runc 容器运行时深度解析系列](./README.md) → 第七篇：CRIU 检查点与恢复  
> **上一篇：** [安全特性实现](./06-安全特性实现.md)  
> **最后更新：** 2024

## 概述

本文深入分析 runc 如何集成 CRIU (Checkpoint/Restore in Userspace) 实现容器的检查点创建和恢复功能。这项技术使得容器可以停止、保存状态并在其他位置恢复运行。

## 概述

CRIU (Checkpoint/Restore in Userspace) 是Linux系统中用于在用户空间实现进程检查点和恢复的技术。runc集成了CRIU，使容器能够在运行时保存完整状态并在稍后恢复，这对于容器迁移、负载均衡和故障恢复至关重要。

## 1. CRIU基础原理

### 1.1 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                     容器检查点/恢复流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  运行中容器                    检查点                         │
│  ┌─────────┐                 ┌──────────┐                  │
│  │ Process │ ──freeze──>     │  Image   │                  │
│  │  Tree   │                 │  Files   │                  │
│  │         │ ──dump──>       │          │                  │
│  │ Memory  │                 │ *.img    │                  │
│  │  FDs    │                 │ files    │                  │
│  │ Network │                 └──────────┘                  │
│  └─────────┘                      │                        │
│       ↑                           │                        │
│       │                           │                        │
│       └────────restore────────────┘                        │
│                                                            │
│  关键组件:                                                  │
│  • Process Tree: 完整进程层次结构                           │
│  • Memory Pages: 内存页面映像                              │
│  • File Descriptors: 文件描述符状态                        │
│  • Network State: 网络连接和接口                           │
│  • Namespaces: 命名空间配置                                │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 CRIU工作原理

```go
// libcontainer/criu_linux.go
// CRIU通过以下步骤实现容器状态保存和恢复

// 1. 冻结进程树
func freezeProcessTree(pid int) error {
    // 使用cgroup freezer或SIGSTOP信号
    // 确保进程状态不变
}

// 2. 收集进程信息
func collectProcessInfo() ProcessInfo {
    // 遍历/proc文件系统
    // 收集进程树、内存映射、文件描述符等
    return ProcessInfo{
        PID:         pid,
        Memory:      getMemoryMappings(),
        FileDescriptors: getOpenFiles(),
        Sockets:     getSocketInfo(),
        Namespaces:  getNamespaceInfo(),
    }
}

// 3. 序列化状态
func serializeState(info ProcessInfo, dir string) error {
    // 将状态写入多个映像文件
    // core-*.img: 进程核心信息
    // pagemap-*.img: 内存页映射
    // fdinfo-*.img: 文件描述符信息
    // sk-*.img: 套接字信息
}

// 4. 恢复进程
func restoreProcess(dir string) error {
    // 从映像文件读取状态
    // 重建进程树和资源
    // 恢复内存和执行状态
}
```

## 2. runc中的CRIU集成

### 2.1 架构设计

```
┌────────────────────────────────────────────────────────────┐
│                    runc CRIU集成架构                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐        ┌───────────────┐               │
│  │   runc CLI   │        │  libcontainer │               │
│  │              │        │               │               │
│  │ checkpoint   │───────>│  criu_linux.go│               │
│  │  restore     │        │               │               │
│  └──────────────┘        └───────┬───────┘               │
│                                  │                        │
│                                  │ RPC                    │
│                                  │                        │
│                          ┌───────▼───────┐               │
│                          │    CRIU       │               │
│                          │   Service     │               │
│                          │               │               │
│                          │ • dump        │               │
│                          │ • restore     │               │
│                          │ • pre-dump    │               │
│                          │ • page-server │               │
│                          └───────────────┘               │
│                                                          │
│  关键文件:                                                │
│  • checkpoint.go: 检查点命令实现                          │
│  • restore.go: 恢复命令实现                              │
│  • libcontainer/criu_linux.go: 核心CRIU集成逻辑          │
│  • libcontainer/criu_opts_linux.go: CRIU选项配置         │
│                                                          │
└────────────────────────────────────────────────────────────┘
```

### 2.2 检查点实现

```go
// checkpoint.go
var checkpointCommand = cli.Command{
    Name:  "checkpoint",
    Usage: "checkpoint a running container",
    Flags: []cli.Flag{
        cli.StringFlag{
            Name:  "image-path",
            Value: "",
            Usage: "path for saving checkpoint files",
        },
        cli.BoolFlag{
            Name:  "leave-running",
            Usage: "leave the container running after checkpoint",
        },
        cli.BoolFlag{
            Name:  "tcp-established",
            Usage: "allow open tcp connections",
        },
        cli.BoolFlag{
            Name:  "external-unix-sockets",
            Usage: "allow external unix sockets",
        },
        cli.BoolFlag{
            Name:  "shell-job",
            Usage: "allow shell jobs",
        },
        cli.BoolFlag{
            Name:  "lazy-pages",
            Usage: "use lazy migration mechanism",
        },
        cli.BoolFlag{
            Name:  "pre-dump",
            Usage: "perform pre-dump for iterative migration",
        },
    },
}

// libcontainer/criu_linux.go
func (c *Container) Checkpoint(criuOpts *CriuOpts) error {
    c.m.Lock()
    defer c.m.Unlock()
    
    // 1. 验证容器状态
    if !c.hasInit() {
        return errors.New("container is not running")
    }
    
    // 2. 检查CRIU版本
    if err := c.checkCriuVersion(); err != nil {
        return err
    }
    
    // 3. 准备CRIU请求
    req := &criurpc.CriuReq{
        Type: &criuReqType,
        Opts: &criurpc.CriuOpts{
            ImagesDirFd:     proto.Int32(int32(imageDir.Fd())),
            WorkDirFd:       proto.Int32(int32(workDir.Fd())),
            LogLevel:        proto.Int32(4),
            LogFile:         proto.String("criu.log"),
            Root:            proto.String(c.config.Rootfs),
            ManageCgroups:   proto.Bool(true),
            TcpEstablished:  proto.Bool(criuOpts.TcpEstablished),
            ExternalUnixSockets: proto.Bool(criuOpts.ExternalUnixConnections),
            ShellJob:        proto.Bool(criuOpts.ShellJob),
            FileLocks:       proto.Bool(criuOpts.FileLocks),
            EmptyNs:         proto.Uint32(criuOpts.EmptyNs),
        },
    }
    
    // 4. 配置特殊选项
    if criuOpts.PreDump {
        // 预转储用于迭代迁移
        req.Type = proto.String("PRE_DUMP")
        req.Opts.TrackMem = proto.Bool(true)
    }
    
    if criuOpts.LazyPages {
        // 懒页面迁移
        req.Opts.LazyPages = proto.Bool(true)
        req.Opts.StatusFd = proto.Int32(int32(statusFd))
    }
    
    // 5. 处理外部挂载
    for _, m := range c.config.Mounts {
        if m.Device == "bind" {
            extMnt := &criurpc.ExtMountMap{
                Key: proto.String(m.Destination),
                Val: proto.String(m.Source),
            }
            req.Opts.ExtMnt = append(req.Opts.ExtMnt, extMnt)
        }
    }
    
    // 6. 保存文件描述符信息
    fds := c.initProcess.externalDescriptors()
    fdsJSON, _ := json.Marshal(fds)
    os.WriteFile(filepath.Join(criuOpts.ImagesDirectory, "descriptors.json"), fdsJSON, 0600)
    
    // 7. 执行CRIU dump
    if err := c.criuSwrk(nil, req, criuOpts, nil); err != nil {
        return err
    }
    
    // 8. 处理后续操作
    if !criuOpts.LeaveRunning && !criuOpts.PreDump {
        // 如果不保持运行，销毁容器
        c.destroy()
    }
    
    return nil
}
```

### 2.3 恢复实现

```go
// restore.go
var restoreCommand = cli.Command{
    Name:  "restore",
    Usage: "restore a container from a checkpoint",
    Flags: []cli.Flag{
        cli.StringFlag{
            Name:  "image-path",
            Usage: "path to checkpoint files",
        },
        cli.StringFlag{
            Name:  "bundle, b",
            Usage: "path to the root of the bundle directory",
        },
        cli.BoolFlag{
            Name:  "tcp-established",
            Usage: "allow open tcp connections",
        },
        cli.BoolFlag{
            Name:  "lazy-pages",
            Usage: "use lazy migration mechanism",
        },
        cli.StringFlag{
            Name:  "manage-cgroups-mode",
            Usage: "cgroups management mode (soft|full|strict|ignore)",
        },
    },
}

// libcontainer/criu_linux.go
func (c *Container) Restore(process *Process, criuOpts *CriuOpts) error {
    c.m.Lock()
    defer c.m.Unlock()
    
    // 1. 准备根文件系统
    root := filepath.Join(c.stateDir, "criu-root")
    if err := os.Mkdir(root, 0755); err != nil {
        return err
    }
    
    // 绑定挂载rootfs到CRIU可访问位置
    if err := mount(c.config.Rootfs, root, "", unix.MS_BIND|unix.MS_REC, ""); err != nil {
        return err
    }
    defer umount(root, unix.MNT_DETACH)
    
    // 2. 创建CRIU恢复请求
    req := &criurpc.CriuReq{
        Type: proto.String("RESTORE"),
        Opts: &criurpc.CriuOpts{
            ImagesDirFd:    proto.Int32(int32(imageDir.Fd())),
            WorkDirFd:      proto.Int32(int32(workDir.Fd())),
            LogLevel:       proto.Int32(4),
            LogFile:        proto.String("criu-restore.log"),
            Root:           proto.String(root),
            ManageCgroups:  proto.Bool(true),
            ManageCgroupsMode: proto.String(criuOpts.ManageCgroupsMode),
            TcpEstablished: proto.Bool(criuOpts.TcpEstablished),
            LazyPages:      proto.Bool(criuOpts.LazyPages),
        },
    }
    
    // 3. 配置命名空间
    for _, ns := range c.config.Namespaces {
        switch ns.Type {
        case configs.NetworkNamespace:
            // 网络命名空间特殊处理
            if ns.Path != "" {
                // 外部网络命名空间
                req.Opts.ExtUnixSk = proto.Bool(true)
                req.Opts.NetNsFile = proto.String(ns.Path)
            }
        case configs.PidNamespace:
            // PID命名空间处理
            if ns.Path != "" {
                req.Opts.PidNsFile = proto.String(ns.Path)
            }
        }
    }
    
    // 4. 恢复网络接口
    for _, iface := range c.config.Networks {
        switch iface.Type {
        case "veth":
            veth := &criurpc.CriuVethPair{
                IfOut: proto.String(iface.HostInterfaceName),
                IfIn:  proto.String(iface.Name),
            }
            req.Opts.Veths = append(req.Opts.Veths, veth)
        case "loopback":
            // 回环接口自动恢复
        }
    }
    
    // 5. 加载文件描述符信息
    descriptorsFile := filepath.Join(criuOpts.ImagesDirectory, "descriptors.json")
    if descriptorsJSON, err := os.ReadFile(descriptorsFile); err == nil {
        var descriptors []string
        json.Unmarshal(descriptorsJSON, &descriptors)
        // 重新打开外部文件描述符
        for _, desc := range descriptors {
            // 处理管道、套接字等
        }
    }
    
    // 6. 执行CRIU恢复
    if err := c.criuSwrk(process, req, criuOpts, extraFiles); err != nil {
        return err
    }
    
    // 7. 更新容器状态
    c.state = &restoredState{
        imageDir: criuOpts.ImagesDirectory,
        c:        c,
    }
    
    // 8. 应用cgroups设置
    if err := c.cgroupManager.Apply(c.initProcess.pid()); err != nil {
        return err
    }
    
    return nil
}
```

## 3. 进程树和内存管理

### 3.1 进程树序列化

```go
// 进程树保存结构
type ProcessTreeEntry struct {
    PID      int32           `json:"pid"`
    PPID     int32           `json:"ppid"`
    PGID     int32           `json:"pgid"`
    SID      int32           `json:"sid"`
    Threads  []int32         `json:"threads"`
    Children []int32         `json:"children"`
    State    string          `json:"state"`
    Command  string          `json:"command"`
}

// 收集进程树信息
func collectProcessTree(rootPid int) (*ProcessTreeEntry, error) {
    tree := &ProcessTreeEntry{
        PID: int32(rootPid),
    }
    
    // 读取/proc/[pid]/stat获取进程信息
    statPath := fmt.Sprintf("/proc/%d/stat", rootPid)
    statData, err := os.ReadFile(statPath)
    if err != nil {
        return nil, err
    }
    
    // 解析进程状态
    fields := strings.Fields(string(statData))
    tree.PPID = parseInt32(fields[3])
    tree.PGID = parseInt32(fields[4])
    tree.SID = parseInt32(fields[5])
    tree.State = fields[2]
    
    // 收集线程信息
    taskDir := fmt.Sprintf("/proc/%d/task", rootPid)
    tasks, _ := os.ReadDir(taskDir)
    for _, task := range tasks {
        tid, _ := strconv.Atoi(task.Name())
        if tid != rootPid {
            tree.Threads = append(tree.Threads, int32(tid))
        }
    }
    
    // 递归收集子进程
    childrenPath := fmt.Sprintf("/proc/%d/task/%d/children", rootPid, rootPid)
    childrenData, _ := os.ReadFile(childrenPath)
    for _, childPid := range strings.Fields(string(childrenData)) {
        pid, _ := strconv.Atoi(childPid)
        tree.Children = append(tree.Children, int32(pid))
        
        // 递归处理子进程树
        if childTree, err := collectProcessTree(pid); err == nil {
            // 合并子进程信息
        }
    }
    
    return tree, nil
}
```

### 3.2 内存页面管理

```go
// 内存映射信息
type MemoryMapping struct {
    Start      uint64  `json:"start"`
    End        uint64  `json:"end"`
    Flags      uint32  `json:"flags"`
    Protection uint32  `json:"prot"`
    Offset     uint64  `json:"offset"`
    Device     string  `json:"device"`
    Inode      uint64  `json:"inode"`
    Path       string  `json:"path"`
}

// 收集内存映射
func collectMemoryMappings(pid int) ([]MemoryMapping, error) {
    mapsPath := fmt.Sprintf("/proc/%d/maps", pid)
    mapsFile, err := os.Open(mapsPath)
    if err != nil {
        return nil, err
    }
    defer mapsFile.Close()
    
    var mappings []MemoryMapping
    scanner := bufio.NewScanner(mapsFile)
    
    for scanner.Scan() {
        // 解析格式: address perms offset dev inode pathname
        // 例如: 00400000-00452000 r-xp 00000000 08:02 173521 /usr/bin/dbus-daemon
        line := scanner.Text()
        fields := strings.Fields(line)
        
        var mapping MemoryMapping
        
        // 解析地址范围
        addrRange := strings.Split(fields[0], "-")
        mapping.Start, _ = strconv.ParseUint(addrRange[0], 16, 64)
        mapping.End, _ = strconv.ParseUint(addrRange[1], 16, 64)
        
        // 解析权限
        perms := fields[1]
        if strings.Contains(perms, "r") {
            mapping.Protection |= 0x1 // PROT_READ
        }
        if strings.Contains(perms, "w") {
            mapping.Protection |= 0x2 // PROT_WRITE
        }
        if strings.Contains(perms, "x") {
            mapping.Protection |= 0x4 // PROT_EXEC
        }
        
        // 解析其他字段
        mapping.Offset, _ = strconv.ParseUint(fields[2], 16, 64)
        mapping.Device = fields[3]
        mapping.Inode, _ = strconv.ParseUint(fields[4], 10, 64)
        
        if len(fields) > 5 {
            mapping.Path = fields[5]
        }
        
        mappings = append(mappings, mapping)
    }
    
    return mappings, nil
}

// 懒页面迁移支持
type LazyPagesServer struct {
    uffd       int    // userfaultfd文件描述符
    pageSize   int
    memoryFile *os.File
}

func (l *LazyPagesServer) handlePageFault(addr uint64) error {
    // 计算页面偏移
    pageAddr := addr &^ uint64(l.pageSize-1)
    offset := int64(pageAddr)
    
    // 从映像文件读取页面
    pageData := make([]byte, l.pageSize)
    _, err := l.memoryFile.ReadAt(pageData, offset)
    if err != nil {
        return err
    }
    
    // 将页面写入目标地址
    copy := uffdio_copy{
        dst:  pageAddr,
        src:  uint64(uintptr(unsafe.Pointer(&pageData[0]))),
        len:  uint64(l.pageSize),
        mode: 0,
    }
    
    _, err = ioctl(l.uffd, UFFDIO_COPY, &copy)
    return err
}
```

## 4. 网络状态保存与恢复

### 4.1 网络接口管理

```go
// 网络接口信息
type NetworkInterface struct {
    Name      string   `json:"name"`
    Type      string   `json:"type"`
    HwAddr    string   `json:"hwaddr"`
    Addresses []string `json:"addresses"`
    State     string   `json:"state"`
    Master    string   `json:"master"`
}

// 保存网络配置
func saveNetworkState(c *Container) error {
    var interfaces []NetworkInterface
    
    // 进入容器网络命名空间
    runtime.LockOSThread()
    defer runtime.UnlockOSThread()
    
    oldNs, _ := netns.Get()
    defer oldNs.Close()
    
    newNs, _ := netns.GetFromPid(c.initProcess.pid())
    defer newNs.Close()
    
    netns.Set(newNs)
    defer netns.Set(oldNs)
    
    // 枚举网络接口
    ifaces, _ := net.Interfaces()
    for _, iface := range ifaces {
        netIface := NetworkInterface{
            Name:   iface.Name,
            HwAddr: iface.HardwareAddr.String(),
            State:  getInterfaceState(iface),
        }
        
        // 获取IP地址
        addrs, _ := iface.Addrs()
        for _, addr := range addrs {
            netIface.Addresses = append(netIface.Addresses, addr.String())
        }
        
        interfaces = append(interfaces, netIface)
    }
    
    // 保存到文件
    data, _ := json.Marshal(interfaces)
    return os.WriteFile(filepath.Join(c.stateDir, "network.json"), data, 0644)
}

// TCP连接保存
type TCPConnection struct {
    LocalAddr  string `json:"local_addr"`
    RemoteAddr string `json:"remote_addr"`
    State      string `json:"state"`
    SendQueue  int    `json:"send_queue"`
    RecvQueue  int    `json:"recv_queue"`
}

func saveTCPConnections(pid int) ([]TCPConnection, error) {
    // 读取/proc/[pid]/net/tcp获取TCP连接
    tcpPath := fmt.Sprintf("/proc/%d/net/tcp", pid)
    tcpFile, err := os.Open(tcpPath)
    if err != nil {
        return nil, err
    }
    defer tcpFile.Close()
    
    var connections []TCPConnection
    scanner := bufio.NewScanner(tcpFile)
    scanner.Scan() // 跳过标题行
    
    for scanner.Scan() {
        fields := strings.Fields(scanner.Text())
        if len(fields) < 12 {
            continue
        }
        
        conn := TCPConnection{
            LocalAddr:  parseSocketAddr(fields[1]),
            RemoteAddr: parseSocketAddr(fields[2]),
            State:      tcpStateToString(fields[3]),
        }
        
        fmt.Sscanf(fields[4], "%X:%X", &conn.SendQueue, &conn.RecvQueue)
        connections = append(connections, conn)
    }
    
    return connections, nil
}
```

### 4.2 虚拟网络设备

```go
// Veth对恢复
func restoreVethPair(hostName, containerName string) error {
    // 创建veth对
    link := &netlink.Veth{
        LinkAttrs: netlink.LinkAttrs{
            Name: hostName,
        },
        PeerName: containerName,
    }
    
    if err := netlink.LinkAdd(link); err != nil {
        return err
    }
    
    // 获取容器端接口
    containerLink, err := netlink.LinkByName(containerName)
    if err != nil {
        return err
    }
    
    // 移动到容器命名空间
    if err := netlink.LinkSetNsPid(containerLink, containerPid); err != nil {
        return err
    }
    
    // 配置主机端接口
    hostLink, _ := netlink.LinkByName(hostName)
    netlink.LinkSetUp(hostLink)
    
    return nil
}

// 网桥连接恢复
func restoreBridgeConnection(vethName, bridgeName string) error {
    bridge, err := netlink.LinkByName(bridgeName)
    if err != nil {
        return err
    }
    
    veth, err := netlink.LinkByName(vethName)
    if err != nil {
        return err
    }
    
    // 将veth添加到网桥
    return netlink.LinkSetMaster(veth, bridge.(*netlink.Bridge))
}
```

## 5. 文件描述符管理

### 5.1 文件描述符序列化

```go
// 文件描述符信息
type FileDescriptor struct {
    FD      int    `json:"fd"`
    Path    string `json:"path"`
    Type    string `json:"type"`
    Flags   int    `json:"flags"`
    Mode    uint32 `json:"mode"`
    Offset  int64  `json:"offset"`
    IsPipe  bool   `json:"is_pipe"`
    IsSocket bool  `json:"is_socket"`
}

// 收集文件描述符
func collectFileDescriptors(pid int) ([]FileDescriptor, error) {
    fdDir := fmt.Sprintf("/proc/%d/fd", pid)
    entries, err := os.ReadDir(fdDir)
    if err != nil {
        return nil, err
    }
    
    var descriptors []FileDescriptor
    
    for _, entry := range entries {
        fdNum, _ := strconv.Atoi(entry.Name())
        fdPath := filepath.Join(fdDir, entry.Name())
        
        // 读取符号链接目标
        target, err := os.Readlink(fdPath)
        if err != nil {
            continue
        }
        
        fd := FileDescriptor{
            FD:   fdNum,
            Path: target,
        }
        
        // 判断文件描述符类型
        if strings.HasPrefix(target, "pipe:") {
            fd.Type = "pipe"
            fd.IsPipe = true
        } else if strings.HasPrefix(target, "socket:") {
            fd.Type = "socket"
            fd.IsSocket = true
        } else if strings.HasPrefix(target, "/") {
            fd.Type = "file"
            // 获取文件状态
            if stat, err := os.Stat(target); err == nil {
                fd.Mode = uint32(stat.Mode())
            }
        }
        
        // 获取文件描述符标志
        fdInfoPath := fmt.Sprintf("/proc/%d/fdinfo/%d", pid, fdNum)
        if info, err := os.ReadFile(fdInfoPath); err == nil {
            // 解析fdinfo文件
            lines := strings.Split(string(info), "\n")
            for _, line := range lines {
                if strings.HasPrefix(line, "flags:") {
                    fmt.Sscanf(line, "flags:\t%o", &fd.Flags)
                } else if strings.HasPrefix(line, "pos:") {
                    fmt.Sscanf(line, "pos:\t%d", &fd.Offset)
                }
            }
        }
        
        descriptors = append(descriptors, fd)
    }
    
    return descriptors, nil
}

// 恢复文件描述符
func restoreFileDescriptors(descriptors []FileDescriptor) error {
    for _, desc := range descriptors {
        switch desc.Type {
        case "file":
            // 打开普通文件
            fd, err := syscall.Open(desc.Path, desc.Flags, desc.Mode)
            if err != nil {
                return err
            }
            
            // 设置偏移量
            if desc.Offset > 0 {
                syscall.Seek(fd, desc.Offset, 0)
            }
            
            // 如果需要特定的FD号，使用dup2
            if fd != desc.FD {
                syscall.Dup2(fd, desc.FD)
                syscall.Close(fd)
            }
            
        case "pipe":
            // 管道需要特殊处理
            // 通常由CRIU自动处理
            
        case "socket":
            // 套接字恢复
            // 需要根据套接字类型进行不同处理
        }
    }
    
    return nil
}
```

### 5.2 管道和套接字处理

```go
// 管道恢复
type PipeInfo struct {
    ReadEnd  int `json:"read_end"`
    WriteEnd int `json:"write_end"`
    Buffer   []byte `json:"buffer"`
}

func restorePipe(info PipeInfo) error {
    // 创建管道
    var pipeFds [2]int
    if err := syscall.Pipe(pipeFds); err != nil {
        return err
    }
    
    // 恢复管道缓冲区内容
    if len(info.Buffer) > 0 {
        syscall.Write(pipeFds[1], info.Buffer)
    }
    
    // 复制到正确的文件描述符
    if pipeFds[0] != info.ReadEnd {
        syscall.Dup2(pipeFds[0], info.ReadEnd)
        syscall.Close(pipeFds[0])
    }
    
    if pipeFds[1] != info.WriteEnd {
        syscall.Dup2(pipeFds[1], info.WriteEnd)
        syscall.Close(pipeFds[1])
    }
    
    return nil
}

// Unix域套接字恢复
func restoreUnixSocket(path string, sockType int) (int, error) {
    // 创建套接字
    fd, err := syscall.Socket(syscall.AF_UNIX, sockType, 0)
    if err != nil {
        return -1, err
    }
    
    // 绑定到路径
    addr := &syscall.SockaddrUnix{Name: path}
    if err := syscall.Bind(fd, addr); err != nil {
        syscall.Close(fd)
        return -1, err
    }
    
    // 如果是监听套接字，开始监听
    if sockType == syscall.SOCK_STREAM {
        syscall.Listen(fd, 128)
    }
    
    return fd, nil
}
```

## 6. 增量迁移和优化

### 6.1 预转储(Pre-dump)机制

```go
// 预转储实现迭代迁移
func performPreDump(c *Container, opts *CriuOpts) error {
    // 启用内存跟踪
    opts.PreDump = true
    opts.TrackMem = true
    
    // 第一次预转储 - 转储大部分内存
    if err := c.Checkpoint(opts); err != nil {
        return err
    }
    
    // 可以执行多次预转储，每次只转储脏页
    for i := 0; i < opts.PreDumpIterations; i++ {
        // 设置父映像路径
        opts.ParentImage = opts.ImagesDirectory
        opts.ImagesDirectory = fmt.Sprintf("%s-%d", opts.ImagesDirectory, i+1)
        
        // 执行增量转储
        if err := c.Checkpoint(opts); err != nil {
            return err
        }
        
        // 检查脏页数量
        stats := getCriuStats(opts.ImagesDirectory)
        if stats.DirtyPages < opts.DirtyPageThreshold {
            break // 脏页足够少，可以执行最终转储
        }
    }
    
    // 最终转储并停止容器
    opts.PreDump = false
    opts.LeaveRunning = false
    return c.Checkpoint(opts)
}

// 内存页跟踪
type MemoryTracker struct {
    trackedPages map[uint64]bool
    dirtyPages   map[uint64]bool
}

func (mt *MemoryTracker) trackMemoryChanges(pid int) error {
    // 使用软脏页机制跟踪内存变化
    clearRefsPath := fmt.Sprintf("/proc/%d/clear_refs", pid)
    
    // 清除软脏页标记
    if err := os.WriteFile(clearRefsPath, []byte("4"), 0); err != nil {
        return err
    }
    
    // 等待一段时间让进程运行
    time.Sleep(100 * time.Millisecond)
    
    // 读取脏页信息
    pagemapPath := fmt.Sprintf("/proc/%d/pagemap", pid)
    pagemap, err := os.Open(pagemapPath)
    if err != nil {
        return err
    }
    defer pagemap.Close()
    
    // 解析pagemap找出脏页
    buf := make([]byte, 8)
    for addr := uint64(0); ; addr += 4096 {
        _, err := pagemap.ReadAt(buf, int64(addr/4096*8))
        if err != nil {
            break
        }
        
        entry := binary.LittleEndian.Uint64(buf)
        if entry&(1<<55) != 0 { // 检查软脏位
            mt.dirtyPages[addr] = true
        }
    }
    
    return nil
}
```

### 6.2 懒页面恢复

```go
// 懒页面服务器
func startLazyPagesServer(imagesDir string) (*LazyPagesServer, error) {
    // 创建userfaultfd
    uffd, err := syscall.Syscall(syscall.SYS_USERFAULTFD, 
        syscall.O_CLOEXEC|syscall.O_NONBLOCK, 0, 0)
    if err != 0 {
        return nil, err
    }
    
    server := &LazyPagesServer{
        uffd:       int(uffd),
        pageSize:   4096,
        imagesDir:  imagesDir,
        pageCache:  make(map[uint64][]byte),
    }
    
    // 启动页面故障处理循环
    go server.handlePageFaults()
    
    return server, nil
}

func (s *LazyPagesServer) handlePageFaults() {
    for {
        // 等待页面故障事件
        msg := uffd_msg{}
        _, err := syscall.Read(s.uffd, (*(*[unsafe.Sizeof(msg)]byte)(unsafe.Pointer(&msg)))[:])
        if err != nil {
            continue
        }
        
        if msg.event != UFFD_EVENT_PAGEFAULT {
            continue
        }
        
        // 获取故障地址
        addr := msg.arg.pagefault.address
        
        // 检查缓存
        if page, ok := s.pageCache[addr]; ok {
            s.copyPage(addr, page)
            continue
        }
        
        // 从映像文件加载页面
        page := s.loadPageFromImage(addr)
        if page != nil {
            s.pageCache[addr] = page
            s.copyPage(addr, page)
        }
    }
}

func (s *LazyPagesServer) copyPage(addr uint64, data []byte) error {
    copy := uffdio_copy{
        dst:  addr,
        src:  uint64(uintptr(unsafe.Pointer(&data[0]))),
        len:  uint64(len(data)),
        mode: 0,
    }
    
    _, _, errno := syscall.Syscall(syscall.SYS_IOCTL, uintptr(s.uffd),
        UFFDIO_COPY, uintptr(unsafe.Pointer(&copy)))
    
    if errno != 0 {
        return errno
    }
    
    return nil
}
```

## 7. 实践练习

### 7.1 基础检查点操作

```bash
# 1. 启动一个容器
sudo runc run -d mycontainer

# 2. 创建检查点
sudo runc checkpoint \
    --image-path /tmp/checkpoint \
    --leave-running \
    mycontainer

# 3. 查看检查点文件
ls -la /tmp/checkpoint/
# 输出:
# -rw-r--r-- 1 root root  1234 core-1.img
# -rw-r--r-- 1 root root  5678 pagemap-1.img
# -rw-r--r-- 1 root root   456 fdinfo-2.img
# -rw-r--r-- 1 root root   789 descriptors.json

# 4. 停止原容器
sudo runc kill mycontainer

# 5. 从检查点恢复
sudo runc restore \
    --image-path /tmp/checkpoint \
    --bundle /path/to/bundle \
    restored-container
```

### 7.2 迭代迁移实验

```go
// 实现迭代迁移的示例代码
package main

import (
    "fmt"
    "github.com/opencontainers/runc/libcontainer"
)

func iterativeMigration(container libcontainer.Container, targetHost string) error {
    opts := &libcontainer.CriuOpts{
        ImagesDirectory: "/tmp/migration",
        PreDump:        true,
        TrackMem:       true,
    }
    
    // 阶段1: 初始预转储
    fmt.Println("执行初始预转储...")
    if err := container.Checkpoint(opts); err != nil {
        return err
    }
    
    // 传输初始映像到目标主机
    transferImages(opts.ImagesDirectory, targetHost)
    
    // 阶段2: 增量预转储
    for i := 0; i < 3; i++ {
        opts.ParentImage = opts.ImagesDirectory
        opts.ImagesDirectory = fmt.Sprintf("/tmp/migration-%d", i+1)
        
        fmt.Printf("执行增量预转储 %d...\n", i+1)
        if err := container.Checkpoint(opts); err != nil {
            return err
        }
        
        // 传输增量数据
        transferImages(opts.ImagesDirectory, targetHost)
        
        // 检查脏页率
        if getDirtyPageRate() < 0.1 {
            break
        }
    }
    
    // 阶段3: 最终转储并停止
    opts.PreDump = false
    opts.LeaveRunning = false
    fmt.Println("执行最终转储...")
    if err := container.Checkpoint(opts); err != nil {
        return err
    }
    
    // 传输最终数据
    transferImages(opts.ImagesDirectory, targetHost)
    
    // 在目标主机恢复
    fmt.Println("在目标主机恢复容器...")
    return restoreOnTarget(targetHost, opts.ImagesDirectory)
}
```

### 7.3 懒页面恢复测试

```go
// 测试懒页面恢复功能
func testLazyRestore() {
    // 1. 创建检查点时启用懒页面
    checkpointOpts := &CriuOpts{
        ImagesDirectory: "/tmp/lazy-checkpoint",
        LazyPages:      true,
    }
    
    container.Checkpoint(checkpointOpts)
    
    // 2. 启动懒页面服务器
    pageServer := &CriuPageServerInfo{
        Address: "127.0.0.1",
        Port:    9999,
    }
    
    go startPageServer(pageServer, checkpointOpts.ImagesDirectory)
    
    // 3. 恢复容器（懒加载模式）
    restoreOpts := &CriuOpts{
        ImagesDirectory: "/tmp/lazy-checkpoint",
        LazyPages:      true,
        PageServer:     pageServer,
    }
    
    container.Restore(process, restoreOpts)
    
    // 4. 监控页面故障和加载
    monitorLazyPages()
}
```

## 8. 故障排查

### 8.1 常见问题

```bash
# 1. CRIU版本检查
criu --version
# 需要 >= 3.0

# 2. 检查CRIU日志
cat /tmp/checkpoint/criu.log | grep Error

# 3. 验证内核支持
criu check
# 输出:
# Looks good.

# 4. 检查必需的内核特性
cat /proc/config.gz | gunzip | grep CONFIG_CHECKPOINT_RESTORE
# CONFIG_CHECKPOINT_RESTORE=y

# 5. 文件描述符泄漏检查
ls -la /proc/$(pidof container)/fd/
```

### 8.2 调试技巧

```go
// 启用CRIU详细日志
func enableCriuDebug(opts *CriuOpts) {
    opts.LogLevel = 4  // 最详细
    opts.LogFile = "criu-debug.log"
    
    // 保留中间文件
    opts.WorkDirectory = "/tmp/criu-work"
    
    // 输出统计信息
    opts.PrintStats = true
}

// 分析CRIU错误
func analyzeCriuError(logPath string) {
    log, _ := os.ReadFile(logPath)
    lines := strings.Split(string(log), "\n")
    
    for i, line := range lines {
        if strings.Contains(line, "Error") {
            // 打印错误上下文
            start := max(0, i-5)
            end := min(len(lines), i+5)
            
            fmt.Println("错误上下文:")
            for j := start; j < end; j++ {
                if j == i {
                    fmt.Printf(">>> %s\n", lines[j])
                } else {
                    fmt.Printf("    %s\n", lines[j])
                }
            }
        }
    }
}
```

## 总结

CRIU集成使runc具备了强大的容器状态管理能力，实现了:

1. **完整状态保存**: 进程树、内存、文件描述符、网络状态的完整序列化
2. **灵活恢复机制**: 支持本地恢复、远程迁移、懒加载等多种恢复方式
3. **性能优化**: 预转储、增量迁移、懒页面等技术最小化停机时间
4. **生产级可靠性**: 完善的错误处理、日志记录和故障恢复机制

通过掌握CRIU的原理和runc的集成实现，我们能够构建支持热迁移、故障恢复和负载均衡的高可用容器平台。