import{_ as n,c as a,a as e,o as l}from"./app-DDxSucZD.js";const i={};function p(r,s){return l(),a("div",null,s[0]||(s[0]=[e(`<h1 id="runc-容器生命周期流程图" tabindex="-1"><a class="header-anchor" href="#runc-容器生命周期流程图"><span>runc 容器生命周期流程图</span></a></h1><h2 id="_1-runc-容器创建总体流程" tabindex="-1"><a class="header-anchor" href="#_1-runc-容器创建总体流程"><span>1. runc 容器创建总体流程</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> TD</span>
<span class="line">    A<span class="token text string">[runc create/run]</span> <span class="token arrow operator">--&gt;</span> B<span class="token text string">[解析OCI配置]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> C<span class="token text string">[创建Factory]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> D<span class="token text string">[生成libcontainer配置]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> E<span class="token text string">[创建Container实例]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> F<span class="token text string">[启动父进程]</span></span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> G<span class="token text string">[nsexec.c引导]</span></span>
<span class="line">    G <span class="token arrow operator">--&gt;</span> H<span class="token text string">[创建命名空间]</span></span>
<span class="line">    H <span class="token arrow operator">--&gt;</span> I<span class="token text string">[设置安全策略]</span></span>
<span class="line">    I <span class="token arrow operator">--&gt;</span> J<span class="token text string">[挂载文件系统]</span></span>
<span class="line">    J <span class="token arrow operator">--&gt;</span> K<span class="token text string">[应用资源限制]</span></span>
<span class="line">    K <span class="token arrow operator">--&gt;</span> L<span class="token text string">[执行init进程]</span></span>
<span class="line">    L <span class="token arrow operator">--&gt;</span> M<span class="token text string">[启动容器进程]</span></span>
<span class="line">    M <span class="token arrow operator">--&gt;</span> N<span class="token text string">[容器运行中]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2-runc-命令流程对比" tabindex="-1"><a class="header-anchor" href="#_2-runc-命令流程对比"><span>2. runc 命令流程对比</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> LR</span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;runc create&quot;</span></span>
<span class="line">        A1<span class="token text string">[create命令]</span> <span class="token arrow operator">--&gt;</span> B1<span class="token text string">[startContainer]</span></span>
<span class="line">        B1 <span class="token arrow operator">--&gt;</span> C1<span class="token text string">[CT_ACT_CREATE]</span></span>
<span class="line">        C1 <span class="token arrow operator">--&gt;</span> D1<span class="token text string">[容器已创建但未启动]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;runc start&quot;</span></span>
<span class="line">        A2<span class="token text string">[start命令]</span> <span class="token arrow operator">--&gt;</span> B2<span class="token text string">[加载现有容器]</span></span>
<span class="line">        B2 <span class="token arrow operator">--&gt;</span> C2<span class="token text string">[container.Start]</span></span>
<span class="line">        C2 <span class="token arrow operator">--&gt;</span> D2<span class="token text string">[启动容器进程]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;runc run&quot;</span></span>
<span class="line">        A3<span class="token text string">[run命令]</span> <span class="token arrow operator">--&gt;</span> B3<span class="token text string">[startContainer]</span></span>
<span class="line">        B3 <span class="token arrow operator">--&gt;</span> C3<span class="token text string">[CT_ACT_RUN]</span></span>
<span class="line">        C3 <span class="token arrow operator">--&gt;</span> D3<span class="token text string">[创建并立即启动]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3-nsexec-c-三阶段引导过程" tabindex="-1"><a class="header-anchor" href="#_3-nsexec-c-三阶段引导过程"><span>3. nsexec.c 三阶段引导过程</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> TD</span>
<span class="line">    A<span class="token text string">[Stage 0: STAGE_PARENT]</span> <span class="token arrow operator">--&gt;</span> B<span class="token text string">[Stage 1: STAGE_CHILD]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> C<span class="token text string">[Stage 2: STAGE_INIT]</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;Stage 0 详细&quot;</span></span>
<span class="line">        A1<span class="token text string">[解析netlink配置]</span></span>
<span class="line">        A2<span class="token text string">[创建子进程clone_parent]</span></span>
<span class="line">        A3<span class="token text string">[处理用户命名空间映射]</span></span>
<span class="line">        A4<span class="token text string">[管理进程同步]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;Stage 1 详细&quot;</span></span>
<span class="line">        B1<span class="token text string">[加入指定命名空间setns]</span></span>
<span class="line">        B2<span class="token text string">[unshare新命名空间]</span></span>
<span class="line">        B3<span class="token text string">[创建PID命名空间子进程]</span></span>
<span class="line">        B4<span class="token text string">[协调用户命名空间映射]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;Stage 2 详细&quot;</span></span>
<span class="line">        C1<span class="token text string">[设置会话ID setsid]</span></span>
<span class="line">        C2<span class="token text string">[切换到容器用户/组]</span></span>
<span class="line">        C3<span class="token text string">[返回Go运行时最终设置]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4-命名空间创建顺序和依赖关系" tabindex="-1"><a class="header-anchor" href="#_4-命名空间创建顺序和依赖关系"><span>4. 命名空间创建顺序和依赖关系</span></a></h2><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">命名空间创建顺序（关键在于User NS必须最先创建）:</span>
<span class="line"></span>
<span class="line">┌─────────────┐    ┌─────────────┐    ┌─────────────┐</span>
<span class="line">│ User NS     │───▶│ IPC NS      │───▶│ UTS NS      │</span>
<span class="line">│ (NEWUSER)   │    │ (NEWIPC)    │    │ (NEWUTS)    │</span>
<span class="line">│ 用户隔离    │    │ IPC隔离     │    │ 主机名隔离  │</span>
<span class="line">└─────────────┘    └─────────────┘    └─────────────┘</span>
<span class="line">       │                   │                   │</span>
<span class="line">       ▼                   ▼                   ▼</span>
<span class="line">┌─────────────┐    ┌─────────────┐    ┌─────────────┐</span>
<span class="line">│ Network NS  │    │ PID NS      │    │ Mount NS    │</span>
<span class="line">│ (NEWNET)    │    │ (NEWPID)    │    │ (NEWNS)     │</span>
<span class="line">│ 网络隔离    │    │ 进程隔离    │    │ 文件系统隔离│</span>
<span class="line">└─────────────┘    └─────────────┘    └─────────────┘</span>
<span class="line">       │                   │                   │</span>
<span class="line">       ▼                   ▼                   ▼</span>
<span class="line">┌─────────────┐    ┌─────────────┐</span>
<span class="line">│ Cgroup NS   │    │ Time NS     │</span>
<span class="line">│ (NEWCGROUP) │    │ (NEWTIME)   │</span>
<span class="line">│ Cgroup隔离  │    │ 时间隔离    │</span>
<span class="line">└─────────────┘    └─────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5-进程通信和同步机制" tabindex="-1"><a class="header-anchor" href="#_5-进程通信和同步机制"><span>5. 进程通信和同步机制</span></a></h2><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">父进程 (runc)          子进程 (init)         容器进程</span>
<span class="line">      │                     │                    │</span>
<span class="line">      │  initSockParent ◄──►│ initSockChild      │</span>
<span class="line">      │  ─────────────────── │                   │</span>
<span class="line">      │                     │                   │</span>
<span class="line">      │  syncSockParent ◄──►│ syncSockChild      │</span>
<span class="line">      │  ─────────────────── │                   │</span>
<span class="line">      │                     │                   │</span>
<span class="line">      │  logPipeParent  ◄───│ logPipeChild       │</span>
<span class="line">      │  ─────────────────── │                   │</span>
<span class="line">      │                     │                   │</span>
<span class="line">      │     FIFO通道     ◄──│────────────────────│</span>
<span class="line">      │  ─────────────────── │                   │</span>
<span class="line">      </span>
<span class="line">同步消息类型:</span>
<span class="line">- SYNC_USERMAP_PLS/ACK  (用户映射请求/确认)</span>
<span class="line">- SYNC_RECVPID_PLS/ACK  (PID发送请求/确认)</span>
<span class="line">- SYNC_GRANDCHILD       (孙进程就绪)</span>
<span class="line">- SYNC_CHILD_FINISH     (子进程完成)</span>
<span class="line">- SYNC_TIMEOFFSETS_*    (时间偏移设置)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_6-安全策略应用流程" tabindex="-1"><a class="header-anchor" href="#_6-安全策略应用流程"><span>6. 安全策略应用流程</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> TD</span>
<span class="line">    A<span class="token text string">[容器创建]</span> <span class="token arrow operator">--&gt;</span> B<span class="token text string">[命名空间隔离]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> C<span class="token text string">[用户权限管理]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> D<span class="token text string">[Capabilities设置]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> E<span class="token text string">[Seccomp过滤器]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> F<span class="token text string">[LSM策略应用]</span></span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> G<span class="token text string">[NoNewPrivileges]</span></span>
<span class="line">    G <span class="token arrow operator">--&gt;</span> H<span class="token text string">[文件系统安全]</span></span>
<span class="line">    H <span class="token arrow operator">--&gt;</span> I<span class="token text string">[资源限制]</span></span>
<span class="line">    I <span class="token arrow operator">--&gt;</span> J<span class="token text string">[执行容器进程]</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;安全层级&quot;</span></span>
<span class="line">        B1<span class="token text string">[命名空间隔离 - 第一层]</span></span>
<span class="line">        D1<span class="token text string">[Capabilities - 第二层]</span></span>
<span class="line">        E1<span class="token text string">[Seccomp - 第三层]</span></span>
<span class="line">        F1<span class="token text string">[AppArmor/SELinux - 第四层]</span></span>
<span class="line">        I1<span class="token text string">[Cgroups限制 - 第五层]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_7-文件系统挂载和隔离流程" tabindex="-1"><a class="header-anchor" href="#_7-文件系统挂载和隔离流程"><span>7. 文件系统挂载和隔离流程</span></a></h2><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">┌────────────────────────────────────────────────────────────┐</span>
<span class="line">│                      Rootfs 准备流程                       │</span>
<span class="line">├────────────────────────────────────────────────────────────┤</span>
<span class="line">│                                                           │</span>
<span class="line">│  1. Mount Namespace 创建                                  │</span>
<span class="line">│     └── unshare(CLONE_NEWNS)                             │</span>
<span class="line">│                                                           │</span>
<span class="line">│  2. 基础挂载点准备                                        │</span>
<span class="line">│     ├── /proc (proc文件系统)                             │</span>
<span class="line">│     ├── /sys (sysfs文件系统)                             │</span>
<span class="line">│     ├── /dev (devtmpfs或bind挂载)                        │</span>
<span class="line">│     └── /dev/pts (devpts伪终端)                          │</span>
<span class="line">│                                                           │</span>
<span class="line">│  3. 用户挂载点处理                                        │</span>
<span class="line">│     ├── bind挂载 (源目录绑定)                            │</span>
<span class="line">│     ├── tmpfs挂载 (内存文件系统)                         │</span>
<span class="line">│     └── 特殊文件系统                                      │</span>
<span class="line">│                                                           │</span>
<span class="line">│  4. 安全挂载选项                                          │</span>
<span class="line">│     ├── MS_NOEXEC (禁止执行)                             │</span>
<span class="line">│     ├── MS_NOSUID (禁止setuid)                           │</span>
<span class="line">│     ├── MS_NODEV (禁止设备文件)                          │</span>
<span class="line">│     └── 挂载传播控制                                      │</span>
<span class="line">│                                                           │</span>
<span class="line">│  5. pivot_root或chroot                                   │</span>
<span class="line">│     └── 切换根文件系统                                    │</span>
<span class="line">│                                                           │</span>
<span class="line">│  6. 路径安全处理                                          │</span>
<span class="line">│     ├── MaskedPaths (隐藏路径)                           │</span>
<span class="line">│     └── ReadonlyPaths (只读路径)                         │</span>
<span class="line">│                                                           │</span>
<span class="line">└────────────────────────────────────────────────────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_8-cgroups-资源管理架构" tabindex="-1"><a class="header-anchor" href="#_8-cgroups-资源管理架构"><span>8. Cgroups 资源管理架构</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> TB</span>
<span class="line">    A<span class="token text string">[Container]</span> <span class="token arrow operator">--&gt;</span> B<span class="token text string">[Cgroup Manager]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> C<span class="token text string">[Memory Controller]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> D<span class="token text string">[CPU Controller]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> E<span class="token text string">[BlockIO Controller]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> F<span class="token text string">[Device Controller]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> G<span class="token text string">[Network Controller]</span></span>
<span class="line">    </span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> C1<span class="token text string">[memory.limit_in_bytes]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> C2<span class="token text string">[memory.oom_control]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> C3<span class="token text string">[memory.swappiness]</span></span>
<span class="line">    </span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D1<span class="token text string">[cpu.shares]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D2<span class="token text string">[cpu.cfs_quota_us]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D3<span class="token text string">[cpu.cfs_period_us]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D4<span class="token text string">[cpuset.cpus]</span></span>
<span class="line">    </span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E1<span class="token text string">[blkio.weight]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E2<span class="token text string">[blkio.throttle.read_bps_device]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E3<span class="token text string">[blkio.throttle.write_bps_device]</span></span>
<span class="line">    </span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> F1<span class="token text string">[devices.allow]</span></span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> F2<span class="token text string">[devices.deny]</span></span>
<span class="line">    </span>
<span class="line">    G <span class="token arrow operator">--&gt;</span> G1<span class="token text string">[net_cls.classid]</span></span>
<span class="line">    G <span class="token arrow operator">--&gt;</span> G2<span class="token text string">[net_prio.ifpriomap]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_9-容器状态转换图" tabindex="-1"><a class="header-anchor" href="#_9-容器状态转换图"><span>9. 容器状态转换图</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">stateDiagram-v2</span></span>
<span class="line">    <span class="token text string">[*]</span> <span class="token arrow operator">--&gt;</span> Creating<span class="token operator">:</span> runc create/run</span>
<span class="line">    Creating <span class="token arrow operator">--&gt;</span> Created<span class="token operator">:</span> 创建成功</span>
<span class="line">    Creating <span class="token arrow operator">--&gt;</span> <span class="token text string">[*]</span><span class="token operator">:</span> 创建失败</span>
<span class="line">    </span>
<span class="line">    Created <span class="token arrow operator">--&gt;</span> Running<span class="token operator">:</span> runc start</span>
<span class="line">    Created <span class="token arrow operator">--&gt;</span> <span class="token text string">[*]</span><span class="token operator">:</span> runc delete</span>
<span class="line">    </span>
<span class="line">    Running <span class="token arrow operator">--&gt;</span> Paused<span class="token operator">:</span> runc pause</span>
<span class="line">    Paused <span class="token arrow operator">--&gt;</span> Running<span class="token operator">:</span> runc resume</span>
<span class="line">    </span>
<span class="line">    Running <span class="token arrow operator">--&gt;</span> Stopped<span class="token operator">:</span> 进程退出</span>
<span class="line">    Paused <span class="token arrow operator">--&gt;</span> Stopped<span class="token operator">:</span> runc kill</span>
<span class="line">    </span>
<span class="line">    Stopped <span class="token arrow operator">--&gt;</span> <span class="token text string">[*]</span><span class="token operator">:</span> runc delete</span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">note right of</span> Creating</span>
<span class="line">        - OCI配置解析</span>
<span class="line">        - 命名空间创建</span>
<span class="line">        - 资源分配</span>
<span class="line">    <span class="token keyword">end note</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">note right of</span> Running</span>
<span class="line">        - 进程执行中</span>
<span class="line">        - 资源监控</span>
<span class="line">        - 信号处理</span>
<span class="line">    <span class="token keyword">end note</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_10-runc-错误处理和清理流程" tabindex="-1"><a class="header-anchor" href="#_10-runc-错误处理和清理流程"><span>10. runc 错误处理和清理流程</span></a></h2><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">┌─────────────────────────────────────────────────────────────┐</span>
<span class="line">│                    错误处理和清理机制                        │</span>
<span class="line">├─────────────────────────────────────────────────────────────┤</span>
<span class="line">│                                                            │</span>
<span class="line">│  创建阶段错误处理:                                          │</span>
<span class="line">│  ┌──────────────────────────────────────────────────────┐   │</span>
<span class="line">│  │  defer func() {                                     │   │</span>
<span class="line">│  │      if retErr != nil {                             │   │</span>
<span class="line">│  │          _ = p.terminate()        // 终止进程       │   │</span>
<span class="line">│  │          _ = p.manager.Destroy()  // 清理cgroup     │   │</span>
<span class="line">│  │          _ = p.intelRdtManager.Destroy() // 清理RDT │   │</span>
<span class="line">│  │      }                                              │   │</span>
<span class="line">│  │  }()                                                │   │</span>
<span class="line">│  └──────────────────────────────────────────────────────┘   │</span>
<span class="line">│                                                            │</span>
<span class="line">│  运行时错误检测:                                            │</span>
<span class="line">│  ┌──────────────────────────────────────────────────────┐   │</span>
<span class="line">│  │  - OOM检测和处理                                     │   │</span>
<span class="line">│  │  - 进程退出状态监控                                  │   │</span>
<span class="line">│  │  - 信号传播和处理                                    │   │</span>
<span class="line">│  │  - 僵尸进程清理                                      │   │</span>
<span class="line">│  │  - 文件描述符泄漏防护                                │   │</span>
<span class="line">│  └──────────────────────────────────────────────────────┘   │</span>
<span class="line">│                                                            │</span>
<span class="line">│  清理顺序:                                                 │</span>
<span class="line">│  1. 发送SIGKILL信号                                        │</span>
<span class="line">│  2. 等待进程终止                                           │</span>
<span class="line">│  3. 清理cgroup资源                                         │</span>
<span class="line">│  4. 清理Intel RDT资源                                      │</span>
<span class="line">│  5. 清理挂载点                                             │</span>
<span class="line">│  6. 清理状态文件                                           │</span>
<span class="line">│  7. 关闭通信通道                                           │</span>
<span class="line">│                                                            │</span>
<span class="line">└─────────────────────────────────────────────────────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_11-网络配置和管理流程" tabindex="-1"><a class="header-anchor" href="#_11-网络配置和管理流程"><span>11. 网络配置和管理流程</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">graph</span> TD</span>
<span class="line">    A<span class="token text string">[容器网络配置]</span> <span class="token arrow operator">--&gt;</span> B<span class="token text string">[Network Namespace创建]</span></span>
<span class="line">    B <span class="token arrow operator">--&gt;</span> C<span class="token text string">[网络策略应用]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> D<span class="token text string">[Loopback接口配置]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> E<span class="token text string">[外部网络接口]</span></span>
<span class="line">    C <span class="token arrow operator">--&gt;</span> F<span class="token text string">[路由配置]</span></span>
<span class="line">    </span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D1<span class="token text string">[lo接口启动]</span></span>
<span class="line">    D <span class="token arrow operator">--&gt;</span> D2<span class="token text string">[127.0.0.1配置]</span></span>
<span class="line">    </span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E1<span class="token text string">[veth pair创建]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E2<span class="token text string">[接口移动到容器NS]</span></span>
<span class="line">    E <span class="token arrow operator">--&gt;</span> E3<span class="token text string">[IP地址配置]</span></span>
<span class="line">    </span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> F1<span class="token text string">[默认路由]</span></span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> F2<span class="token text string">[静态路由]</span></span>
<span class="line">    F <span class="token arrow operator">--&gt;</span> F3<span class="token text string">[路由策略]</span></span>
<span class="line">    </span>
<span class="line">    <span class="token keyword">subgraph</span> <span class="token string">&quot;网络隔离层级&quot;</span></span>
<span class="line">        G1<span class="token text string">[网络命名空间隔离]</span></span>
<span class="line">        G2<span class="token text string">[接口级别隔离]</span></span>
<span class="line">        G3<span class="token text string">[路由级别隔离]</span></span>
<span class="line">        G4<span class="token text string">[防火墙规则隔离]</span></span>
<span class="line">    <span class="token keyword">end</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_12-系统调用使用时序图" tabindex="-1"><a class="header-anchor" href="#_12-系统调用使用时序图"><span>12. 系统调用使用时序图</span></a></h2><div class="language-mermaid line-numbers-mode" data-highlighter="prismjs" data-ext="mermaid" data-title="mermaid"><pre><code><span class="line"><span class="token keyword">sequenceDiagram</span></span>
<span class="line">    <span class="token keyword">participant</span> P as Parent Process</span>
<span class="line">    <span class="token keyword">participant</span> C as Child Process</span>
<span class="line">    <span class="token keyword">participant</span> K as Linux Kernel</span>
<span class="line">    </span>
<span class="line">    P<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> clone<span class="token punctuation">(</span>CLONE_NEWNS<span class="token label property">|CLONE_NEWPID|</span>...<span class="token punctuation">)</span></span>
<span class="line">    K<span class="token arrow operator">--&gt;&gt;</span>P<span class="token operator">:</span> child_pid</span>
<span class="line">    </span>
<span class="line">    P<span class="token arrow operator">-&gt;&gt;</span>C<span class="token operator">:</span> 发送配置数据</span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> setns<span class="token text string">(existing_ns_fd)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> unshare<span class="token text string">(CLONE_NEWUSER)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> prctl<span class="token text string">(PR_SET_NO_NEW_PRIVS)</span></span>
<span class="line">    </span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> mount<span class="token punctuation">(</span><span class="token string">&quot;/proc&quot;</span>, <span class="token string">&quot;/proc&quot;</span>, <span class="token string">&quot;proc&quot;</span>, MS_NOEXEC<span class="token label property">|MS_NOSUID|</span>MS_NODEV<span class="token punctuation">)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> mount<span class="token punctuation">(</span><span class="token string">&quot;/sys&quot;</span>, <span class="token string">&quot;/sys&quot;</span>, <span class="token string">&quot;sysfs&quot;</span>, MS_NOEXEC<span class="token label property">|MS_NOSUID|</span>MS_NODEV<span class="token punctuation">)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> mount<span class="token text string">(&quot;/dev&quot;, &quot;/dev&quot;, &quot;devtmpfs&quot;, 0)</span></span>
<span class="line">    </span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> pivot_root<span class="token text string">(&quot;/container/root&quot;, &quot;/container/root/old&quot;)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> umount<span class="token text string">(&quot;/old&quot;)</span></span>
<span class="line">    </span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> capset<span class="token text string">(&amp;header, &amp;data)</span></span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> prctl<span class="token text string">(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &amp;prog)</span></span>
<span class="line">    </span>
<span class="line">    C<span class="token arrow operator">-&gt;&gt;</span>K<span class="token operator">:</span> execve<span class="token text string">(&quot;/container/bin/app&quot;, argv, envp)</span></span>
<span class="line">    K<span class="token arrow operator">--&gt;&gt;</span>C<span class="token operator">:</span> 容器进程开始执行</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这些图表详细展示了runc容器运行时的各个关键流程，从高层架构到具体实现细节，帮助理解runc是如何协调Linux内核的各种特性来实现安全、隔离的容器环境。</p>`,26)]))}const c=n(i,[["render",p]]),d=JSON.parse('{"path":"/blogs/cloud-base/runc-container-lifecycle-diagrams.html","title":"runc 容器生命周期流程图","lang":"en-US","frontmatter":{"title":"runc 容器生命周期流程图","date":"2024-01-20T00:00:00.000Z","tags":["runc","容器生命周期","流程图","架构图","容器技术","可视化","系统设计"],"categories":["cloud-base"],"sidebar":"auto","description":"通过详细的流程图和架构图展示runc容器生命周期的各个阶段，包括创建、启动、运行等关键流程"},"headers":[{"level":2,"title":"1. runc 容器创建总体流程","slug":"_1-runc-容器创建总体流程","link":"#_1-runc-容器创建总体流程","children":[]},{"level":2,"title":"2. runc 命令流程对比","slug":"_2-runc-命令流程对比","link":"#_2-runc-命令流程对比","children":[]},{"level":2,"title":"3. nsexec.c 三阶段引导过程","slug":"_3-nsexec-c-三阶段引导过程","link":"#_3-nsexec-c-三阶段引导过程","children":[]},{"level":2,"title":"4. 命名空间创建顺序和依赖关系","slug":"_4-命名空间创建顺序和依赖关系","link":"#_4-命名空间创建顺序和依赖关系","children":[]},{"level":2,"title":"5. 进程通信和同步机制","slug":"_5-进程通信和同步机制","link":"#_5-进程通信和同步机制","children":[]},{"level":2,"title":"6. 安全策略应用流程","slug":"_6-安全策略应用流程","link":"#_6-安全策略应用流程","children":[]},{"level":2,"title":"7. 文件系统挂载和隔离流程","slug":"_7-文件系统挂载和隔离流程","link":"#_7-文件系统挂载和隔离流程","children":[]},{"level":2,"title":"8. Cgroups 资源管理架构","slug":"_8-cgroups-资源管理架构","link":"#_8-cgroups-资源管理架构","children":[]},{"level":2,"title":"9. 容器状态转换图","slug":"_9-容器状态转换图","link":"#_9-容器状态转换图","children":[]},{"level":2,"title":"10. runc 错误处理和清理流程","slug":"_10-runc-错误处理和清理流程","link":"#_10-runc-错误处理和清理流程","children":[]},{"level":2,"title":"11. 网络配置和管理流程","slug":"_11-网络配置和管理流程","link":"#_11-网络配置和管理流程","children":[]},{"level":2,"title":"12. 系统调用使用时序图","slug":"_12-系统调用使用时序图","link":"#_12-系统调用使用时序图","children":[]}],"git":{"createdTime":1752167911000,"updatedTime":1752167911000,"contributors":[{"name":"户盛年","email":"hushengnian@hushengniandeMacBook-Air.local","commits":1}]},"filePathRelative":"blogs/cloud-base/runc-container-lifecycle-diagrams.md"}');export{c as comp,d as data};
