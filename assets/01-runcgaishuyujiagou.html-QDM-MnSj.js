import{_ as c,c as o,b as s,a as r,e as a,d as e,w as p,r as t,o as d}from"./app-6X7aTgdN.js";const u={},v={href:"https://github.com/opencontainers/runtime-spec",target:"_blank",rel:"noopener noreferrer"},m={href:"https://containerd.io/docs/getting-started/",target:"_blank",rel:"noopener noreferrer"},b={href:"https://github.com/opencontainers/runc",target:"_blank",rel:"noopener noreferrer"},k={href:"https://www.kernel.org/doc/Documentation/cgroup-v1/cgroups.txt",target:"_blank",rel:"noopener noreferrer"};function g(h,n){const l=t("RouteLink"),i=t("ExternalLinkIcon");return d(),o("div",null,[n[15]||(n[15]=s("h1",{id:"runc-概述与架构",tabindex:"-1"},[s("a",{class:"header-anchor",href:"#runc-概述与架构"},[s("span",null,"runc 概述与架构")])],-1)),s("blockquote",null,[s("p",null,[n[1]||(n[1]=s("strong",null,"系列导航：",-1)),n[2]||(n[2]=a()),e(l,{to:"/blogs/cloud-base/runc-deep-dive/"},{default:p(()=>n[0]||(n[0]=[a("runc 容器运行时深度解析系列")])),_:1,__:[0]}),n[3]||(n[3]=a(" → 第一篇：概述与架构")),n[4]||(n[4]=s("br",null,null,-1)),n[5]||(n[5]=s("strong",null,"最后更新：",-1)),n[6]||(n[6]=a(" 2024"))])]),n[16]||(n[16]=r(`<h2 id="概述" tabindex="-1"><a class="header-anchor" href="#概述"><span>概述</span></a></h2><p>runc 是一个轻量级的容器运行时，专注于根据 OCI (Open Container Initiative) 规范创建和运行容器。作为容器生态系统的基础组件，runc 为 Docker、containerd、Podman 等上层工具提供了标准化的容器执行环境。</p><h2 id="定义与特征" tabindex="-1"><a class="header-anchor" href="#定义与特征"><span>定义与特征</span></a></h2><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line"><span class="token comment"># runc 的基本使用示例</span></span>
<span class="line">$ runc <span class="token parameter variable">--help</span></span>
<span class="line">NAME:</span>
<span class="line">   runc - Open Container Initiative runtime</span>
<span class="line"></span>
<span class="line">USAGE:</span>
<span class="line">   runc <span class="token punctuation">[</span>global options<span class="token punctuation">]</span> <span class="token builtin class-name">command</span> <span class="token punctuation">[</span>command options<span class="token punctuation">]</span> <span class="token punctuation">[</span>arguments<span class="token punctuation">..</span>.<span class="token punctuation">]</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>核心特征：</strong></p><ul><li><strong>低层工具</strong> - 不面向终端用户，主要被其他容器引擎调用</li><li><strong>标准兼容</strong> - 实现 OCI Runtime Specification</li><li><strong>Linux 专用</strong> - 仅支持 Linux 系统</li><li><strong>基础组件</strong> - 被 Docker、containerd、Podman 等高层工具使用</li></ul><h2 id="解决的问题" tabindex="-1"><a class="header-anchor" href="#解决的问题"><span>解决的问题</span></a></h2><p>在 runc 出现之前，容器运行时功能通常与容器引擎紧耦合。runc 的出现解决了：</p><ol><li><strong>标准化问题</strong>: 提供统一的容器运行时接口</li><li><strong>解耦问题</strong>: 将容器运行与镜像管理、网络管理分离</li><li><strong>安全问题</strong>: 提供安全的容器隔离机制</li><li><strong>兼容性问题</strong>: 确保不同容器工具的互操作性</li></ol><h2 id="_2-容器技术栈中的位置" tabindex="-1"><a class="header-anchor" href="#_2-容器技术栈中的位置"><span>2. 容器技术栈中的位置</span></a></h2><h3 id="_2-1-容器技术栈架构" tabindex="-1"><a class="header-anchor" href="#_2-1-容器技术栈架构"><span>2.1 容器技术栈架构</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">┌─────────────────────────────────────────────┐</span>
<span class="line">│  用户接口层                                  │</span>
<span class="line">│  docker, podman, kubectl                   │</span>
<span class="line">└─────────────────────┬───────────────────────┘</span>
<span class="line">                      │</span>
<span class="line">┌─────────────────────▼───────────────────────┐</span>
<span class="line">│  容器引擎层                                  │</span>
<span class="line">│  Docker Daemon, Podman, containerd         │</span>
<span class="line">└─────────────────────┬───────────────────────┘</span>
<span class="line">                      │</span>
<span class="line">┌─────────────────────▼───────────────────────┐</span>
<span class="line">│  高层运行时                                  │</span>
<span class="line">│  containerd, CRI-O                         │</span>
<span class="line">└─────────────────────┬───────────────────────┘</span>
<span class="line">                      │</span>
<span class="line">┌─────────────────────▼───────────────────────┐ ← runc 在这里</span>
<span class="line">│  低层运行时                                  │</span>
<span class="line">│  runc, gVisor, Kata Containers             │</span>
<span class="line">└─────────────────────┬───────────────────────┘</span>
<span class="line">                      │</span>
<span class="line">┌─────────────────────▼───────────────────────┐</span>
<span class="line">│  Linux 内核                                 │</span>
<span class="line">│  Namespaces, Cgroups, Capabilities         │</span>
<span class="line">└─────────────────────────────────────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-职责分工" tabindex="-1"><a class="header-anchor" href="#_2-2-职责分工"><span>2.2 职责分工</span></a></h3><table><thead><tr><th>层级</th><th>主要职责</th><th>runc 的角色</th></tr></thead><tbody><tr><td>用户接口层</td><td>用户体验、命令行/API</td><td>不直接参与</td></tr><tr><td>容器引擎层</td><td>镜像管理、网络、存储</td><td>被调用执行容器</td></tr><tr><td>高层运行时</td><td>容器生命周期管理</td><td>被调用处理具体执行</td></tr><tr><td><strong>低层运行时</strong></td><td><strong>直接与内核交互</strong></td><td><strong>runc 的核心职责</strong></td></tr><tr><td>Linux 内核</td><td>提供隔离和资源管理</td><td>runc 调用内核功能</td></tr></tbody></table><h2 id="_3-oci-规范与-runc" tabindex="-1"><a class="header-anchor" href="#_3-oci-规范与-runc"><span>3. OCI 规范与 runc</span></a></h2><h3 id="_3-1-oci-规范简介" tabindex="-1"><a class="header-anchor" href="#_3-1-oci-规范简介"><span>3.1 OCI 规范简介</span></a></h3><p>OCI (Open Container Initiative) 定义了容器运行时和镜像格式的标准：</p><ul><li><strong>Runtime Specification</strong>: 定义容器的运行时行为</li><li><strong>Image Specification</strong>: 定义容器镜像格式</li><li><strong>Distribution Specification</strong>: 定义镜像分发协议</li></ul><h3 id="_3-2-oci-bundle-结构" tabindex="-1"><a class="header-anchor" href="#_3-2-oci-bundle-结构"><span>3.2 OCI Bundle 结构</span></a></h3><p>runc 工作的基本单位是 <strong>OCI Bundle</strong>：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">/container-bundle/</span>
<span class="line">├── config.json          # 容器配置文件 (OCI Runtime Spec)</span>
<span class="line">└── rootfs/              # 容器的根文件系统</span>
<span class="line">    ├── bin/</span>
<span class="line">    ├── etc/</span>
<span class="line">    ├── lib/</span>
<span class="line">    ├── usr/</span>
<span class="line">    └── ...</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="config-json-示例" tabindex="-1"><a class="header-anchor" href="#config-json-示例"><span>config.json 示例</span></a></h4><div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json" data-title="json"><pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token property">&quot;ociVersion&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1.0.2&quot;</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">&quot;process&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">&quot;args&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&quot;/bin/sh&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">&quot;cwd&quot;</span><span class="token operator">:</span> <span class="token string">&quot;/&quot;</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">&quot;env&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&quot;PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin&quot;</span><span class="token punctuation">]</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">&quot;root&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">&quot;path&quot;</span><span class="token operator">:</span> <span class="token string">&quot;rootfs&quot;</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">&quot;linux&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">&quot;namespaces&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span></span>
<span class="line">      <span class="token punctuation">{</span><span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;pid&quot;</span><span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token punctuation">{</span><span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;network&quot;</span><span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token punctuation">{</span><span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;mount&quot;</span><span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token punctuation">{</span><span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;user&quot;</span><span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">&quot;resources&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token property">&quot;memory&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span><span class="token property">&quot;limit&quot;</span><span class="token operator">:</span> <span class="token number">134217728</span><span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-runc-与-oci-规范的关系" tabindex="-1"><a class="header-anchor" href="#_3-3-runc-与-oci-规范的关系"><span>3.3 runc 与 OCI 规范的关系</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">OCI Runtime Spec ──────────→ runc 实现</span>
<span class="line">     │                          │</span>
<span class="line">     │ 定义标准                   │ 具体实现</span>
<span class="line">     │                          │</span>
<span class="line">     ▼                          ▼</span>
<span class="line">config.json ──────解析───→ libcontainer.Config</span>
<span class="line">     │                          │</span>
<span class="line">     │                          │ </span>
<span class="line">     ▼                          ▼</span>
<span class="line">Bundle ──────────运行────→ 实际的容器进程</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4-runc-整体架构" tabindex="-1"><a class="header-anchor" href="#_4-runc-整体架构"><span>4. runc 整体架构</span></a></h2><h3 id="_4-1-项目结构概览" tabindex="-1"><a class="header-anchor" href="#_4-1-项目结构概览"><span>4.1 项目结构概览</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">runc/</span>
<span class="line">├── main.go                    # CLI 入口点</span>
<span class="line">├── *.go                      # 各种命令实现 (run.go, create.go 等)</span>
<span class="line">├── libcontainer/             # 核心容器库</span>
<span class="line">│   ├── container.go          # 容器接口定义</span>
<span class="line">│   ├── configs/              # 配置管理</span>
<span class="line">│   ├── process.go            # 进程管理</span>
<span class="line">│   ├── init_linux.go         # 容器初始化</span>
<span class="line">│   ├── nsenter/              # namespace 进入机制</span>
<span class="line">│   └── ...</span>
<span class="line">├── internal/                 # 内部工具函数</span>
<span class="line">└── docs/                     # 文档</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-核心架构层次" tabindex="-1"><a class="header-anchor" href="#_4-2-核心架构层次"><span>4.2 核心架构层次</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">┌─────────────────────────────────────────────┐</span>
<span class="line">│              CLI 命令层                      │</span>
<span class="line">│  run, create, start, exec, kill, delete    │</span>
<span class="line">└─────────────────┬───────────────────────────┘</span>
<span class="line">                  │ 命令解析与路由</span>
<span class="line">┌─────────────────▼───────────────────────────┐</span>
<span class="line">│            命令处理层                        │</span>
<span class="line">│     startContainer(), setupSpec()          │</span>
<span class="line">└─────────────────┬───────────────────────────┘</span>
<span class="line">                  │ OCI Bundle 处理</span>
<span class="line">┌─────────────────▼───────────────────────────┐</span>
<span class="line">│          libcontainer 核心层                │</span>
<span class="line">│  Container, Process, Config, Factory       │</span>
<span class="line">└─────────────────┬───────────────────────────┘</span>
<span class="line">                  │ 系统调用封装</span>
<span class="line">┌─────────────────▼───────────────────────────┐</span>
<span class="line">│             Linux 内核层                    │</span>
<span class="line">│   Namespaces, Cgroups, Capabilities        │</span>
<span class="line">└─────────────────────────────────────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-3-关键组件详解" tabindex="-1"><a class="header-anchor" href="#_4-3-关键组件详解"><span>4.3 关键组件详解</span></a></h3><h4 id="a-cli-命令层-main-go" tabindex="-1"><a class="header-anchor" href="#a-cli-命令层-main-go"><span>A. CLI 命令层 (<code>main.go</code>)</span></a></h4><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// main.go 中的关键代码结构</span></span>
<span class="line">app <span class="token operator">:=</span> cli<span class="token punctuation">.</span><span class="token function">NewApp</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">app<span class="token punctuation">.</span>Name <span class="token operator">=</span> <span class="token string">&quot;runc&quot;</span></span>
<span class="line">app<span class="token punctuation">.</span>Commands <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>cli<span class="token punctuation">.</span>Command<span class="token punctuation">{</span></span>
<span class="line">    runCommand<span class="token punctuation">,</span>        <span class="token comment">// 运行容器</span></span>
<span class="line">    createCommand<span class="token punctuation">,</span>     <span class="token comment">// 创建容器  </span></span>
<span class="line">    startCommand<span class="token punctuation">,</span>      <span class="token comment">// 启动容器</span></span>
<span class="line">    execCommand<span class="token punctuation">,</span>       <span class="token comment">// 在容器中执行命令</span></span>
<span class="line">    killCommand<span class="token punctuation">,</span>       <span class="token comment">// 终止容器</span></span>
<span class="line">    deleteCommand<span class="token punctuation">,</span>     <span class="token comment">// 删除容器</span></span>
<span class="line">    <span class="token comment">// ... 更多命令</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>设计特点</strong>：</p><ul><li>使用 <code>urfave/cli</code> 库构建命令行界面</li><li>每个命令对应一个操作，职责清晰</li><li>统一的参数解析和错误处理</li></ul><h4 id="b-libcontainer-核心库" tabindex="-1"><a class="header-anchor" href="#b-libcontainer-核心库"><span>B. libcontainer 核心库</span></a></h4><p><strong>Container 接口</strong> (<code>libcontainer/container.go:60</code>)：</p><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// Container 定义了容器的核心操作接口</span></span>
<span class="line"><span class="token keyword">type</span> Container <span class="token keyword">interface</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 容器状态管理</span></span>
<span class="line">    <span class="token function">ID</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token builtin">string</span></span>
<span class="line">    <span class="token function">State</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">(</span><span class="token operator">*</span>State<span class="token punctuation">,</span> <span class="token builtin">error</span><span class="token punctuation">)</span></span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 进程管理</span></span>
<span class="line">    <span class="token function">Run</span><span class="token punctuation">(</span>process <span class="token operator">*</span>Process<span class="token punctuation">)</span> <span class="token builtin">error</span></span>
<span class="line">    <span class="token function">Start</span><span class="token punctuation">(</span>process <span class="token operator">*</span>Process<span class="token punctuation">)</span> <span class="token builtin">error</span></span>
<span class="line">    <span class="token function">Signal</span><span class="token punctuation">(</span>signal os<span class="token punctuation">.</span>Signal<span class="token punctuation">)</span> <span class="token builtin">error</span></span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 资源管理</span></span>
<span class="line">    <span class="token function">Set</span><span class="token punctuation">(</span>config <span class="token operator">*</span>configs<span class="token punctuation">.</span>Config<span class="token punctuation">)</span> <span class="token builtin">error</span></span>
<span class="line">    <span class="token function">Stats</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">(</span><span class="token operator">*</span>Stats<span class="token punctuation">,</span> <span class="token builtin">error</span><span class="token punctuation">)</span></span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 生命周期管理</span></span>
<span class="line">    <span class="token function">Destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token builtin">error</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>配置管理</strong> (<code>libcontainer/configs/config.go</code>)：</p><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// Config 包含容器的完整配置</span></span>
<span class="line"><span class="token keyword">type</span> Config <span class="token keyword">struct</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 基础信息</span></span>
<span class="line">    Hostname    <span class="token builtin">string</span></span>
<span class="line">    Domainname  <span class="token builtin">string</span></span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 进程配置</span></span>
<span class="line">    Process     <span class="token operator">*</span>Process</span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 资源限制</span></span>
<span class="line">    Cgroups     <span class="token operator">*</span>Cgroup</span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 命名空间配置</span></span>
<span class="line">    Namespaces  Namespaces</span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 安全配置</span></span>
<span class="line">    Capabilities     <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">string</span></span>
<span class="line">    SeccompConfig    <span class="token operator">*</span>Seccomp</span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 挂载点</span></span>
<span class="line">    Mounts      <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token operator">*</span>Mount</span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="c-进程管理-libcontainer-process-go" tabindex="-1"><a class="header-anchor" href="#c-进程管理-libcontainer-process-go"><span>C. 进程管理 (<code>libcontainer/process.go</code>)</span></a></h4><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// Process 定义了进程的配置和状态</span></span>
<span class="line"><span class="token keyword">type</span> Process <span class="token keyword">struct</span> <span class="token punctuation">{</span></span>
<span class="line">    Args         <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">string</span>           <span class="token comment">// 命令行参数</span></span>
<span class="line">    Env          <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token builtin">string</span>           <span class="token comment">// 环境变量</span></span>
<span class="line">    Cwd          <span class="token builtin">string</span>             <span class="token comment">// 工作目录</span></span>
<span class="line">    User         <span class="token builtin">string</span>             <span class="token comment">// 用户ID</span></span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// I/O 配置</span></span>
<span class="line">    Stdin        io<span class="token punctuation">.</span>Reader</span>
<span class="line">    Stdout       io<span class="token punctuation">.</span>Writer</span>
<span class="line">    Stderr       io<span class="token punctuation">.</span>Writer</span>
<span class="line">    </span>
<span class="line">    <span class="token comment">// 进程状态</span></span>
<span class="line">    Pid          <span class="token builtin">int</span></span>
<span class="line">    StartTime    time<span class="token punctuation">.</span>Time</span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5-核心工作流程" tabindex="-1"><a class="header-anchor" href="#_5-核心工作流程"><span>5. 核心工作流程</span></a></h2><h3 id="_5-1-容器创建流程" tabindex="-1"><a class="header-anchor" href="#_5-1-容器创建流程"><span>5.1 容器创建流程</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">用户执行: runc create mycontainer</span>
<span class="line">          │</span>
<span class="line">          ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  1. CLI 解析命令和参数              │</span>
<span class="line">│     main() → createCommand.Action() │</span>
<span class="line">└─────────────┬───────────────────────┘</span>
<span class="line">              │</span>
<span class="line">              ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  2. 加载和验证 OCI Bundle           │</span>
<span class="line">│     setupSpec() → 读取 config.json  │</span>
<span class="line">└─────────────┬───────────────────────┘</span>
<span class="line">              │</span>
<span class="line">              ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  3. 转换为 libcontainer 配置        │</span>
<span class="line">│     specconv.CreateLibcontainerConfig│</span>
<span class="line">└─────────────┬───────────────────────┘</span>
<span class="line">              │</span>
<span class="line">              ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  4. 创建容器实例                    │</span>
<span class="line">│     libcontainer.Create()           │</span>
<span class="line">└─────────────┬───────────────────────┘</span>
<span class="line">              │</span>
<span class="line">              ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  5. 初始化进程准备                  │</span>
<span class="line">│     container.Start() → fork()      │</span>
<span class="line">└─────────────┬───────────────────────┘</span>
<span class="line">              │</span>
<span class="line">              ▼</span>
<span class="line">┌─────────────────────────────────────┐</span>
<span class="line">│  6. 设置隔离环境                    │</span>
<span class="line">│     namespaces, cgroups, security   │</span>
<span class="line">└─────────────────────────────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-代码执行路径" tabindex="-1"><a class="header-anchor" href="#_5-2-代码执行路径"><span>5.2 代码执行路径</span></a></h3><p>以 <code>runc create</code> 命令为例：</p><ol><li><strong>入口</strong>: <code>main.go:main()</code> → CLI 路由</li><li><strong>命令处理</strong>: <code>create.go:createCommand.Action</code></li><li><strong>配置处理</strong>: <code>utils.go:startContainer()</code> → <code>setupSpec()</code></li><li><strong>容器创建</strong>: <code>libcontainer.Create()</code></li><li><strong>进程启动</strong>: <code>container.Start(process)</code></li></ol><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// create.go 中的关键代码</span></span>
<span class="line"><span class="token keyword">var</span> createCommand <span class="token operator">=</span> cli<span class="token punctuation">.</span>Command<span class="token punctuation">{</span></span>
<span class="line">    Name<span class="token punctuation">:</span> <span class="token string">&quot;create&quot;</span><span class="token punctuation">,</span></span>
<span class="line">    Action<span class="token punctuation">:</span> <span class="token keyword">func</span><span class="token punctuation">(</span>context <span class="token operator">*</span>cli<span class="token punctuation">.</span>Context<span class="token punctuation">)</span> <span class="token builtin">error</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token comment">// 解析参数</span></span>
<span class="line">        spec<span class="token punctuation">,</span> err <span class="token operator">:=</span> <span class="token function">setupSpec</span><span class="token punctuation">(</span>context<span class="token punctuation">)</span></span>
<span class="line">        <span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token keyword">return</span> err</span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">        </span>
<span class="line">        <span class="token comment">// 创建容器</span></span>
<span class="line">        <span class="token keyword">return</span> <span class="token function">startContainer</span><span class="token punctuation">(</span>context<span class="token punctuation">,</span> CT_ACT_CREATE<span class="token punctuation">,</span> spec<span class="token punctuation">)</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_6-与其他容器工具的协作" tabindex="-1"><a class="header-anchor" href="#_6-与其他容器工具的协作"><span>6. 与其他容器工具的协作</span></a></h2><h3 id="_6-1-docker-runc" tabindex="-1"><a class="header-anchor" href="#_6-1-docker-runc"><span>6.1 Docker + runc</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">docker run ubuntu:20.04 /bin/bash</span>
<span class="line">       │</span>
<span class="line">       ▼</span>
<span class="line">┌─────────────────┐    ┌──────────────┐    ┌─────────────┐</span>
<span class="line">│   Docker CLI    │───▶│Docker Daemon │───▶│ containerd  │</span>
<span class="line">└─────────────────┘    └──────────────┘    └─────┬───────┘</span>
<span class="line">                                                  │</span>
<span class="line">                       ┌──────────────────────────▼</span>
<span class="line">                       ▼</span>
<span class="line">                  ┌─────────────┐</span>
<span class="line">                  │    runc     │ ← 最终执行容器</span>
<span class="line">                  └─────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>工作分工</strong>：</p><ul><li><strong>Docker CLI</strong>: 用户界面和命令解析</li><li><strong>Docker Daemon</strong>: 镜像管理、网络配置、存储管理</li><li><strong>containerd</strong>: 高层运行时，容器生命周期管理</li><li><strong>runc</strong>: 低层运行时，直接创建和管理容器进程</li></ul><h3 id="_6-2-containerd-runc" tabindex="-1"><a class="header-anchor" href="#_6-2-containerd-runc"><span>6.2 containerd + runc</span></a></h3><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// containerd 调用 runc 的示例</span></span>
<span class="line">task<span class="token punctuation">,</span> err <span class="token operator">:=</span> container<span class="token punctuation">.</span><span class="token function">NewTask</span><span class="token punctuation">(</span>ctx<span class="token punctuation">,</span> cio<span class="token punctuation">.</span><span class="token function">NewCreator</span><span class="token punctuation">(</span>cio<span class="token punctuation">.</span>WithStdio<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> err</span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// containerd 内部会调用 runc create</span></span>
<span class="line"><span class="token comment">// 然后调用 runc start</span></span>
<span class="line">err <span class="token operator">=</span> task<span class="token punctuation">.</span><span class="token function">Start</span><span class="token punctuation">(</span>ctx<span class="token punctuation">)</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-3-kubernetes-runc" tabindex="-1"><a class="header-anchor" href="#_6-3-kubernetes-runc"><span>6.3 Kubernetes + runc</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">kubectl run pod</span>
<span class="line">      │</span>
<span class="line">      ▼</span>
<span class="line">┌─────────────┐    ┌─────────────┐    ┌─────────────┐</span>
<span class="line">│  kubelet    │───▶│   CRI-O     │───▶│    runc     │</span>
<span class="line">└─────────────┘    │     或      │    └─────────────┘</span>
<span class="line">                   │ containerd  │</span>
<span class="line">                   └─────────────┘</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_7-实践练习" tabindex="-1"><a class="header-anchor" href="#_7-实践练习"><span>7. 实践练习</span></a></h2><h3 id="_7-1-环境准备" tabindex="-1"><a class="header-anchor" href="#_7-1-环境准备"><span>7.1 环境准备</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line"><span class="token comment"># 1. 克隆 runc 源码</span></span>
<span class="line"><span class="token function">git</span> clone https://github.com/opencontainers/runc.git</span>
<span class="line"><span class="token builtin class-name">cd</span> runc</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 2. 编译 runc</span></span>
<span class="line"><span class="token function">make</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># 3. 验证安装</span></span>
<span class="line">./runc <span class="token parameter variable">--version</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-2-创建简单容器" tabindex="-1"><a class="header-anchor" href="#_7-2-创建简单容器"><span>7.2 创建简单容器</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line"><span class="token comment"># 1. 创建工作目录</span></span>
<span class="line"><span class="token function">mkdir</span> /tmp/mycontainer</span>
<span class="line"><span class="token builtin class-name">cd</span> /tmp/mycontainer</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 2. 创建根文件系统</span></span>
<span class="line"><span class="token function">mkdir</span> rootfs</span>
<span class="line"><span class="token builtin class-name">cd</span> rootfs</span>
<span class="line"><span class="token comment"># 复制基础文件系统（可以从 Docker 镜像提取）</span></span>
<span class="line"><span class="token function">docker</span> <span class="token builtin class-name">export</span> <span class="token variable"><span class="token variable">$(</span><span class="token function">docker</span> create busybox<span class="token variable">)</span></span> <span class="token operator">|</span> <span class="token function">tar</span> <span class="token parameter variable">-C</span> <span class="token builtin class-name">.</span> <span class="token parameter variable">-xf</span> -</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 3. 生成配置文件</span></span>
<span class="line"><span class="token builtin class-name">cd</span> <span class="token punctuation">..</span></span>
<span class="line">runc spec</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 4. 创建容器</span></span>
<span class="line">runc create mycontainer</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 5. 查看容器状态</span></span>
<span class="line">runc state mycontainer</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 6. 启动容器</span></span>
<span class="line">runc start mycontainer</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-3-代码跟踪练习" tabindex="-1"><a class="header-anchor" href="#_7-3-代码跟踪练习"><span>7.3 代码跟踪练习</span></a></h3><p><strong>任务</strong>: 跟踪 <code>runc create</code> 命令的执行流程</p><ol><li>在 <code>create.go</code> 的 <code>Action</code> 函数中添加日志</li><li>在 <code>utils.go</code> 的 <code>startContainer</code> 函数中添加日志</li><li>观察配置文件的加载和转换过程</li><li>理解 OCI Bundle 到 libcontainer.Config 的转换</li></ol><div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go" data-title="go"><pre><code><span class="line"><span class="token comment">// 在关键位置添加调试信息</span></span>
<span class="line">fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;DEBUG: Loading spec from %s\\n&quot;</span><span class="token punctuation">,</span> bundle<span class="token punctuation">)</span></span>
<span class="line">fmt<span class="token punctuation">.</span><span class="token function">Printf</span><span class="token punctuation">(</span><span class="token string">&quot;DEBUG: Container config: %+v\\n&quot;</span><span class="token punctuation">,</span> config<span class="token punctuation">)</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_8-思考题" tabindex="-1"><a class="header-anchor" href="#_8-思考题"><span>8. 思考题</span></a></h2><ol><li><p><strong>架构设计</strong>: 为什么 runc 要设计成独立的工具，而不是集成到 Docker 中？</p></li><li><p><strong>标准兼容</strong>: OCI 规范为容器生态带来了什么好处？</p></li><li><p><strong>职责分离</strong>: 对比分析容器引擎 (Docker) 和容器运行时 (runc) 的职责差异。</p></li><li><p><strong>安全考虑</strong>: runc 作为 privileged 进程运行，有什么安全风险？如何缓解？</p></li></ol><h2 id="_9-扩展阅读" tabindex="-1"><a class="header-anchor" href="#_9-扩展阅读"><span>9. 扩展阅读</span></a></h2>`,70)),s("ul",null,[s("li",null,[s("a",v,[n[7]||(n[7]=a("OCI Runtime Specification")),e(i)])]),s("li",null,[s("a",m,[n[8]||(n[8]=a("containerd Architecture")),e(i)])]),s("li",null,[s("a",b,[n[9]||(n[9]=a("runc 官方文档")),e(i)])]),s("li",null,[s("a",k,[n[10]||(n[10]=a("Linux Containers 原理")),e(i)])])]),n[17]||(n[17]=s("h2",{id:"总结",tabindex:"-1"},[s("a",{class:"header-anchor",href:"#总结"},[s("span",null,"总结")])],-1)),n[18]||(n[18]=s("p",null,"本文介绍了 runc 在容器生态系统中的定位、核心特征、架构设计以及与其他容器工具的协作关系。runc 作为 OCI 规范的参考实现，为容器技术的标准化和互操作性奠定了基础。",-1)),s("p",null,[n[12]||(n[12]=s("strong",null,"下一篇文章",-1)),n[13]||(n[13]=a(": ")),e(l,{to:"/blogs/cloud-base/runc-deep-dive/02-%E5%AE%B9%E5%99%A8%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E7%AE%A1%E7%90%86.html"},{default:p(()=>n[11]||(n[11]=[a("容器生命周期管理")])),_:1,__:[11]}),n[14]||(n[14]=a(" - 深入了解容器的创建、运行、暂停、恢复和销毁的完整流程。"))])])}const x=c(u,[["render",g]]),_=JSON.parse('{"path":"/blogs/cloud-base/runc-deep-dive/01-runcgaishuyujiagou.html","title":"runc 概述与架构","lang":"en-US","frontmatter":{"title":"runc 概述与架构","date":"2025-08-01T00:00:00.000Z","tags":["runc","云原生","架构设计"],"categories":["cloud-base/runc-deep-dive"],"sidebar":"auto"},"headers":[{"level":2,"title":"概述","slug":"概述","link":"#概述","children":[]},{"level":2,"title":"定义与特征","slug":"定义与特征","link":"#定义与特征","children":[]},{"level":2,"title":"解决的问题","slug":"解决的问题","link":"#解决的问题","children":[]},{"level":2,"title":"2. 容器技术栈中的位置","slug":"_2-容器技术栈中的位置","link":"#_2-容器技术栈中的位置","children":[{"level":3,"title":"2.1 容器技术栈架构","slug":"_2-1-容器技术栈架构","link":"#_2-1-容器技术栈架构","children":[]},{"level":3,"title":"2.2 职责分工","slug":"_2-2-职责分工","link":"#_2-2-职责分工","children":[]}]},{"level":2,"title":"3. OCI 规范与 runc","slug":"_3-oci-规范与-runc","link":"#_3-oci-规范与-runc","children":[{"level":3,"title":"3.1 OCI 规范简介","slug":"_3-1-oci-规范简介","link":"#_3-1-oci-规范简介","children":[]},{"level":3,"title":"3.2 OCI Bundle 结构","slug":"_3-2-oci-bundle-结构","link":"#_3-2-oci-bundle-结构","children":[]},{"level":3,"title":"3.3 runc 与 OCI 规范的关系","slug":"_3-3-runc-与-oci-规范的关系","link":"#_3-3-runc-与-oci-规范的关系","children":[]}]},{"level":2,"title":"4. runc 整体架构","slug":"_4-runc-整体架构","link":"#_4-runc-整体架构","children":[{"level":3,"title":"4.1 项目结构概览","slug":"_4-1-项目结构概览","link":"#_4-1-项目结构概览","children":[]},{"level":3,"title":"4.2 核心架构层次","slug":"_4-2-核心架构层次","link":"#_4-2-核心架构层次","children":[]},{"level":3,"title":"4.3 关键组件详解","slug":"_4-3-关键组件详解","link":"#_4-3-关键组件详解","children":[]}]},{"level":2,"title":"5. 核心工作流程","slug":"_5-核心工作流程","link":"#_5-核心工作流程","children":[{"level":3,"title":"5.1 容器创建流程","slug":"_5-1-容器创建流程","link":"#_5-1-容器创建流程","children":[]},{"level":3,"title":"5.2 代码执行路径","slug":"_5-2-代码执行路径","link":"#_5-2-代码执行路径","children":[]}]},{"level":2,"title":"6. 与其他容器工具的协作","slug":"_6-与其他容器工具的协作","link":"#_6-与其他容器工具的协作","children":[{"level":3,"title":"6.1 Docker + runc","slug":"_6-1-docker-runc","link":"#_6-1-docker-runc","children":[]},{"level":3,"title":"6.2 containerd + runc","slug":"_6-2-containerd-runc","link":"#_6-2-containerd-runc","children":[]},{"level":3,"title":"6.3 Kubernetes + runc","slug":"_6-3-kubernetes-runc","link":"#_6-3-kubernetes-runc","children":[]}]},{"level":2,"title":"7. 实践练习","slug":"_7-实践练习","link":"#_7-实践练习","children":[{"level":3,"title":"7.1 环境准备","slug":"_7-1-环境准备","link":"#_7-1-环境准备","children":[]},{"level":3,"title":"7.2 创建简单容器","slug":"_7-2-创建简单容器","link":"#_7-2-创建简单容器","children":[]},{"level":3,"title":"7.3 代码跟踪练习","slug":"_7-3-代码跟踪练习","link":"#_7-3-代码跟踪练习","children":[]}]},{"level":2,"title":"8. 思考题","slug":"_8-思考题","link":"#_8-思考题","children":[]},{"level":2,"title":"9. 扩展阅读","slug":"_9-扩展阅读","link":"#_9-扩展阅读","children":[]},{"level":2,"title":"总结","slug":"总结","link":"#总结","children":[]}],"git":{"createdTime":1755014556000,"updatedTime":1755014556000,"contributors":[{"name":"hushengnian","email":"hushengnian@example.com","commits":1}]},"filePathRelative":"blogs/cloud-base/runc-deep-dive/01-runc概述与架构.md"}');export{x as comp,_ as data};
